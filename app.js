// App Store 监控应用
class AppStoreMonitor {
    constructor() {
        this.timer = null;
        this.isRunning = false;
        this.queryCount = 0;
        this.results = [];
        this.nextCheckTime = null;
        this.startTime = null;
        this.scheduledStartTime = null;

        this.initElements();
        this.bindEvents();
        this.loadFromStorage();
    }

    initElements() {
        this.elements = {
            appId: document.getElementById('appId'),
            country: document.getElementById('country'),
            startTime: document.getElementById('startTime'),
            frequency: document.getElementById('frequency'),
            startBtn: document.getElementById('startBtn'),
            stopBtn: document.getElementById('stopBtn'),
            clearBtn: document.getElementById('clearBtn'),
            status: document.getElementById('status'),
            nextCheck: document.getElementById('nextCheck'),
            queryCount: document.getElementById('queryCount'),
            availabilityStatus: document.getElementById('availabilityStatus'),
            resultList: document.getElementById('resultList'),
        };
    }

    bindEvents() {
        this.elements.startBtn.addEventListener('click', () => this.start());
        this.elements.stopBtn.addEventListener('click', () => this.stop());
        this.elements.clearBtn.addEventListener('click', () => this.clearResults());
    }

    async checkAppStore() {
        const appId = this.elements.appId.value.trim();
        const country = this.elements.country.value;

        if (!appId) {
            alert('请输入应用ID');
            return;
        }

        try {
            const url = `https://itunes.apple.com/search?id=${appId}&country=${country}&entity=software`;
            const response = await fetch(url);
            const data = await response.json();

            const result = {
                timestamp: new Date(),
                appId: appId,
                country: country,
                isAvailable: data.resultCount > 0,
                appInfo: data.resultCount > 0 ? data.results[0] : null,
            };

            this.addResult(result);
            this.updateStatus(result);
            this.queryCount++;
            this.elements.queryCount.textContent = this.queryCount;
            this.saveToStorage();

            return result;
        } catch (error) {
            console.error('查询失败:', error);
            const errorResult = {
                timestamp: new Date(),
                appId: appId,
                country: country,
                isAvailable: false,
                error: error.message,
            };
            this.addResult(errorResult);
            return errorResult;
        }
    }

    start() {
        const appId = this.elements.appId.value.trim();
        const frequency = parseInt(this.elements.frequency.value);
        const startTimeValue = this.elements.startTime.value;

        if (!appId) {
            alert('请输入应用ID');
            return;
        }

        if (frequency < 10 || frequency > 3600) {
            alert('请求频率必须在10-3600秒之间');
            return;
        }

        // 如果设置了开始时间
        if (startTimeValue) {
            const scheduledTime = new Date(startTimeValue);
            const now = new Date();

            if (scheduledTime <= now) {
                // 如果设置的时间已过，立即开始
                this.startMonitoring(frequency);
            } else {
                // 等待到指定时间再开始
                const delay = scheduledTime - now;
                this.scheduledStartTime = scheduledTime;
                this.elements.status.textContent = `等待开始 (${this.formatDateTime(scheduledTime)})`;
                this.elements.status.className = 'value';
                this.elements.startBtn.disabled = true;
                this.elements.stopBtn.disabled = false;

                setTimeout(() => {
                    this.startMonitoring(frequency);
                }, delay);
            }
        } else {
            // 立即开始
            this.startMonitoring(frequency);
        }
    }

    startMonitoring(frequency) {
        this.isRunning = true;
        this.startTime = new Date();
        this.scheduledStartTime = null;

        this.elements.startBtn.disabled = true;
        this.elements.stopBtn.disabled = false;
        this.elements.status.textContent = '运行中';
        this.elements.status.className = 'value status-running';

        // 立即执行一次查询
        this.checkAppStore();

        // 设置定时查询
        this.timer = setInterval(() => {
            this.checkAppStore();
            this.updateNextCheckTime(frequency);
        }, frequency * 1000);

        this.updateNextCheckTime(frequency);
    }

    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }

        this.isRunning = false;
        this.elements.startBtn.disabled = false;
        this.elements.stopBtn.disabled = true;
        this.elements.status.textContent = '已停止';
        this.elements.status.className = 'value status-stopped';
        this.elements.nextCheck.textContent = '-';
        this.scheduledStartTime = null;

        this.saveToStorage();
    }

    clearResults() {
        if (confirm('确定要清空所有查询记录吗？')) {
            this.results = [];
            this.queryCount = 0;
            this.elements.queryCount.textContent = '0';
            this.elements.resultList.innerHTML = '<div class="empty-state">暂无查询记录</div>';
            this.saveToStorage();
        }
    }

    addResult(result) {
        this.results.unshift(result); // 最新的在前面
        this.renderResults();
    }

    renderResults() {
        if (this.results.length === 0) {
            this.elements.resultList.innerHTML = '<div class="empty-state">暂无查询记录</div>';
            return;
        }

        const html = this.results.map(result => {
            const statusClass = result.isAvailable ? 'available' : 'unavailable';
            const statusText = result.isAvailable ? '✓ 已上线' : '✗ 未上线';
            const timeStr = this.formatDateTime(result.timestamp);

            let detailsHtml = '';
            if (result.isAvailable && result.appInfo) {
                detailsHtml = `
                    <div class="result-details">
                        <div><strong>应用名称:</strong> ${result.appInfo.trackName || '-'}</div>
                        <div><strong>版本:</strong> ${result.appInfo.version || '-'}</div>
                        <div><strong>商店链接:</strong> <a href="${result.appInfo.trackViewUrl}" target="_blank">查看</a></div>
                    </div>
                `;
            } else if (result.error) {
                detailsHtml = `
                    <div class="result-details">
                        <div style="color: #dc3545;"><strong>错误:</strong> ${result.error}</div>
                    </div>
                `;
            } else {
                detailsHtml = `
                    <div class="result-details">
                        <div>应用未在 App Store 找到</div>
                    </div>
                `;
            }

            return `
                <div class="result-item ${statusClass}">
                    <div class="result-header">
                        <span class="result-time">${timeStr}</span>
                        <span class="result-status ${statusClass}">${statusText}</span>
                    </div>
                    <div class="result-details">
                        <div><strong>应用ID:</strong> ${result.appId} | <strong>国家:</strong> ${result.country}</div>
                    </div>
                    ${detailsHtml}
                </div>
            `;
        }).join('');

        this.elements.resultList.innerHTML = html;
    }

    updateStatus(result) {
        if (result.isAvailable) {
            this.elements.availabilityStatus.textContent = '✓ 已上线';
            this.elements.availabilityStatus.className = 'value available';
        } else {
            this.elements.availabilityStatus.textContent = '✗ 未上线';
            this.elements.availabilityStatus.className = 'value unavailable';
        }
    }

    updateNextCheckTime(frequency) {
        if (this.isRunning && this.timer) {
            const nextCheck = new Date(Date.now() + frequency * 1000);
            this.nextCheckTime = nextCheck;
            this.elements.nextCheck.textContent = this.formatDateTime(nextCheck);
        }
    }

    formatDateTime(date) {
        if (!date) return '-';
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const seconds = String(d.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }

    saveToStorage() {
        try {
            const data = {
                results: this.results.slice(0, 100), // 只保存最近100条
                queryCount: this.queryCount,
                appId: this.elements.appId.value,
                country: this.elements.country.value,
                frequency: this.elements.frequency.value,
            };
            localStorage.setItem('appstore_monitor', JSON.stringify(data));
        } catch (error) {
            console.error('保存数据失败:', error);
        }
    }

    loadFromStorage() {
        try {
            const data = localStorage.getItem('appstore_monitor');
            if (data) {
                const parsed = JSON.parse(data);
                if (parsed.results) {
                    this.results = parsed.results.map(r => ({
                        ...r,
                        timestamp: new Date(r.timestamp),
                    }));
                }
                if (parsed.queryCount) {
                    this.queryCount = parsed.queryCount;
                    this.elements.queryCount.textContent = this.queryCount;
                }
                if (parsed.appId) {
                    this.elements.appId.value = parsed.appId;
                }
                if (parsed.country) {
                    this.elements.country.value = parsed.country;
                }
                if (parsed.frequency) {
                    this.elements.frequency.value = parsed.frequency;
                }
                this.renderResults();
            }
        } catch (error) {
            console.error('加载数据失败:', error);
        }
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new AppStoreMonitor();
});

