/**
 * Shared gross payroll line chart by payroll period.
 */
(function (global) {
    'use strict';

    function parseAmount(value) {
        const number = Number(value);
        return Number.isFinite(number) ? number : 0;
    }

    function formatMoney(value, options = {}) {
        return `\u20b1${parseAmount(value).toLocaleString(undefined, options)}`;
    }

    function parseLocalDate(value) {
        if (!value) return null;

        if (value instanceof Date) {
            return Number.isNaN(value.getTime()) ? null : value;
        }

        const text = String(value).trim();
        const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (match) {
            const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
            return Number.isNaN(date.getTime()) ? null : date;
        }

        const date = new Date(text);
        return Number.isNaN(date.getTime()) ? null : date;
    }

    function formatPeriodLabel(start, end, period) {
        if (start && end) {
            const startDate = parseLocalDate(start);
            const endDate = parseLocalDate(end);
            if (startDate && endDate) {
                const startText = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                const endText = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                return `${startText} - ${endText}`;
            }
        }

        const label = String(period || '').trim();
        return label || 'Unknown Period';
    }

    function sortTrends(trends) {
        return [...trends].sort((a, b) => {
            const aStart = a.period_start || '';
            const bStart = b.period_start || '';
            if (aStart && bStart) {
                const aDate = parseLocalDate(aStart);
                const bDate = parseLocalDate(bStart);
                if (aDate && bDate) return aDate - bDate;
                return String(aStart).localeCompare(String(bStart));
            }
            if (aStart) return -1;
            if (bStart) return 1;
            return String(a.label || '').localeCompare(String(b.label || ''));
        });
    }

    function buildPayrollTotalsMap(payroll) {
        const map = new Map();

        for (const record of payroll || []) {
            const start = record.period_start || null;
            const end = record.period_end || null;
            if (!start || !end) continue;

            const key = `${start}|${end}`;
            const existing = map.get(key) || { gross: 0, net: 0, count: 0, period: record.period };
            existing.gross += parseAmount(record.gross_salary);
            existing.net += parseAmount(record.net_salary);
            existing.count += 1;
            map.set(key, existing);
        }

        return map;
    }

    function buildTrendsFromSavedPeriods(savedPeriods, payroll) {
        const totalsMap = buildPayrollTotalsMap(payroll);
        const seen = new Set();

        const trends = (savedPeriods || []).map(period => {
            const start = period.period_start || period.start || null;
            const end = period.period_end || period.end || null;
            if (!start || !end) return null;

            const key = `${start}|${end}`;
            seen.add(key);
            const totals = totalsMap.get(key) || { gross: 0, net: 0, count: 0 };

            return {
                period_start: start,
                period_end: end,
                label: formatPeriodLabel(start, end, period.description || period.display),
                gross: totals.gross,
                net: totals.net,
                count: totals.count,
            };
        }).filter(Boolean);

        for (const [key, totals] of totalsMap.entries()) {
            if (seen.has(key)) continue;
            const [start, end] = key.split('|');
            trends.push({
                period_start: start,
                period_end: end,
                label: formatPeriodLabel(start, end, totals.period),
                gross: totals.gross,
                net: totals.net,
                count: totals.count,
            });
        }

        return sortTrends(trends);
    }

    function buildTrendsFromPayroll(payroll) {
        const map = new Map();

        for (const record of payroll || []) {
            const start = record.period_start || null;
            const end = record.period_end || null;
            const key = start && end
                ? `${start}|${end}`
                : `label|${record.period || 'Unknown Period'}`;

            const existing = map.get(key) || {
                period_start: start,
                period_end: end,
                label: formatPeriodLabel(start, end, record.period),
                gross: 0,
                net: 0,
                count: 0,
            };

            existing.gross += parseAmount(record.gross_salary);
            existing.net += parseAmount(record.net_salary);
            existing.count += 1;
            map.set(key, existing);
        }

        return sortTrends(Array.from(map.values()));
    }

    async function fetchSavedPeriods() {
        const response = await fetch('/api/period/index.php?type=all', {
            method: 'GET',
            credentials: 'include',
            headers: { 'Cache-Control': 'no-cache' },
        });

        if (!response.ok) {
            throw new Error(`Failed to load saved periods (${response.status})`);
        }

        const data = await response.json();
        return Array.isArray(data) ? data : [];
    }

    async function fetchPayrollTrends() {
        const response = await fetch('/api/payroll/trends.php', {
            method: 'GET',
            credentials: 'include',
            headers: { 'Cache-Control': 'no-cache' },
        });

        if (!response.ok) {
            throw new Error(`Failed to load payroll trends (${response.status})`);
        }

        const data = await response.json();
        if (Array.isArray(data)) {
            return sortTrends(data);
        }
        if (Array.isArray(data.trends)) {
            return sortTrends(data.trends);
        }

        return [];
    }

    async function loadTrends(payrollFallback) {
        try {
            return await fetchPayrollTrends();
        } catch (error) {
            console.warn('Payroll trends API unavailable, building chart from saved periods:', error);
        }

        try {
            const savedPeriods = await fetchSavedPeriods();
            if (savedPeriods.length > 0) {
                return buildTrendsFromSavedPeriods(savedPeriods, payrollFallback || []);
            }
        } catch (periodError) {
            console.warn('Saved periods API unavailable:', periodError);
        }

        return buildTrendsFromPayroll(payrollFallback || []);
    }

    function renderGrossPayrollLineChart(canvas, trends, chartRef) {
        if (!canvas || typeof Chart === 'undefined') {
            return chartRef?.instance || null;
        }

        const normalized = sortTrends((trends || []).map(item => ({
            label: item.label || formatPeriodLabel(item.period_start, item.period_end, item.period),
            gross: parseAmount(item.gross),
            net: parseAmount(item.net),
            count: parseAmount(item.count),
            period_start: item.period_start || null,
            period_end: item.period_end || null,
        })));

        if (chartRef?.instance) {
            chartRef.instance.destroy();
            chartRef.instance = null;
        }

        const labels = normalized.length
            ? normalized.map(item => item.label)
            : ['No saved periods yet'];
        const grossValues = normalized.length
            ? normalized.map(item => item.gross)
            : [0];
        const netValues = normalized.length
            ? normalized.map(item => item.net)
            : [0];
        const maxPay = [...grossValues, ...netValues].reduce((max, value) => Math.max(max, parseAmount(value)), 0);

        const totalLabelPlugin = {
            id: 'payrollTotalLabels',
            afterDatasetsDraw(chart) {
                const { ctx, chartArea } = chart;
                const grossMeta = chart.getDatasetMeta(0);
                const netMeta = chart.getDatasetMeta(1);
                if (!grossMeta?.data?.length && !netMeta?.data?.length) return;

                ctx.save();
                ctx.font = '600 11px Inter, sans-serif';
                ctx.textAlign = 'center';

                grossMeta.data.forEach((point, index) => {
                    ctx.fillStyle = '#8a1f27';
                    ctx.textBaseline = 'bottom';
                    const label = `Gross ${formatMoney(grossValues[index] || 0, { maximumFractionDigits: 0 })}`;
                    const y = Math.max(chartArea.top + 14, point.y - 10);
                    ctx.fillText(label, point.x, y);
                });

                netMeta.data.forEach((point, index) => {
                    ctx.fillStyle = '#166534';
                    ctx.textBaseline = 'top';
                    const label = `Net ${formatMoney(netValues[index] || 0, { maximumFractionDigits: 0 })}`;
                    const y = Math.min(chartArea.bottom - 14, point.y + 10);
                    ctx.fillText(label, point.x, y);
                });

                ctx.restore();
            },
        };

        chartRef.instance = new Chart(canvas, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Gross Payroll',
                    data: grossValues,
                    borderColor: '#b0303b',
                    backgroundColor: 'rgba(176, 48, 59, 0.12)',
                    pointBackgroundColor: '#b0303b',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    borderWidth: 2,
                    fill: true,
                    tension: 0.35,
                }, {
                    label: 'Net Payroll',
                    data: netValues,
                    borderColor: '#166534',
                    backgroundColor: 'rgba(22, 101, 52, 0.08)',
                    pointBackgroundColor: '#166534',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    borderWidth: 2,
                    fill: false,
                    tension: 0.35,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: {
                            maxRotation: 45,
                            minRotation: 0,
                            autoSkip: true,
                            maxTicksLimit: 8,
                        },
                    },
                    y: {
                        beginAtZero: true,
                        suggestedMax: maxPay > 0 ? maxPay * 1.2 : undefined,
                        ticks: {
                            callback(value) {
                                return formatMoney(value);
                            },
                        },
                    },
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                    },
                    tooltip: {
                        callbacks: {
                            label(context) {
                                const trend = normalized[context.dataIndex];
                                const gross = `Total Gross: ${formatMoney(trend?.gross ?? context.raw, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                                if (!trend) return gross;
                                const net = `Total Net: ${formatMoney(trend.net, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                                const count = `Employees: ${parseAmount(trend.count)}`;
                                return [gross, net, count];
                            },
                        },
                    },
                },
            },
            plugins: [totalLabelPlugin],
        });

        return chartRef.instance;
    }

    global.PayrollGrossChart = {
        parseAmount,
        formatMoney,
        parseLocalDate,
        formatPeriodLabel,
        buildTrendsFromPayroll,
        buildTrendsFromSavedPeriods,
        fetchSavedPeriods,
        fetchPayrollTrends,
        loadTrends,
        renderGrossPayrollLineChart,
    };
})(window);
