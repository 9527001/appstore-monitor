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
        // 页面加载后自动查询当前版本信息
        this.autoLoadCurrentVersion();
    }

    initElements() {
        this.elements = {
            appId: document.getElementById('appId'),
            country: document.getElementById('country'),
            startTime: document.getElementById('startTime'),
            frequency: document.getElementById('frequency'),
            targetVersion: document.getElementById('targetVersion'),
            webhookUrl: document.getElementById('webhookUrl'),
            startBtn: document.getElementById('startBtn'),
            stopBtn: document.getElementById('stopBtn'),
            clearBtn: document.getElementById('clearBtn'),
            status: document.getElementById('status'),
            nextCheck: document.getElementById('nextCheck'),
            queryCount: document.getElementById('queryCount'),
            resultList: document.getElementById('resultList'),
            currentVersion: document.getElementById('currentVersion'),
            targetVersionDisplay: document.getElementById('targetVersionDisplay'),
            targetVersionStatus: document.getElementById('targetVersionStatus'),
            appInfoPanel: document.getElementById('appInfoPanel'),
            appInfoCard: document.getElementById('appInfoCard'),
            appIcon: document.getElementById('appIcon'),
            appName: document.getElementById('appName'),
            appVersion: document.getElementById('appVersion'),
            appStoreLink: document.getElementById('appStoreLink'),
        };
    }

    bindEvents() {
        this.elements.startBtn.addEventListener('click', () => this.start());
        this.elements.stopBtn.addEventListener('click', () => this.stop());
        this.elements.clearBtn.addEventListener('click', () => this.clearResults());
        // 目标版本输入框变化时，立即检查版本状态
        this.elements.targetVersion.addEventListener('input', () => {
            // 立即更新目标版本显示
            const targetVersion = this.elements.targetVersion.value.trim();
            if (targetVersion) {
                this.elements.targetVersionDisplay.textContent = targetVersion;
            } else {
                this.elements.targetVersionDisplay.textContent = '-';
            }
            
            // 如果有查询结果，更新版本状态
            if (this.results.length > 0) {
                const latestResult = this.results[0];
                this.updateVersionInfo(latestResult);
            }
        });
        // 高级配置折叠/展开
        const advancedHeader = document.querySelector('.advanced-header');
        if (advancedHeader) {
            advancedHeader.addEventListener('click', () => {
                const advancedConfig = advancedHeader.parentElement;
                advancedConfig.classList.toggle('expanded');
            });
        }
    }

    async checkAppStore() {
        const appId = this.elements.appId.value.trim();
        const country = this.elements.country.value;

        if (!appId) {
            // 如果是自动加载，不弹出 alert
            if (!this._isAutoLoad) {
                alert('请输入应用ID');
            }
            return;
        }

        try {
            const url = `https://itunes.apple.com/cn/lookup?id=${appId}&country=us&entity=software`;
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
            
            // 如果是自动加载的查询，不增加查询次数和不保存
            // 注意：自动加载时不在这里调用 updateVersionInfo，会在 autoLoadCurrentVersion 中统一处理
            if (!this._isAutoLoad) {
                this.queryCount++;
                this.elements.queryCount.textContent = this.queryCount;
                this.updateVersionInfo(result);
                this.saveToStorage();
            } else {
                // 自动加载时，不更新版本信息（会在 autoLoadCurrentVersion 中统一处理）
                console.log('🔄 自动加载查询完成，等待更新版本信息');
            }

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
                this.elements.status.className = 'status-value';
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
        this.elements.status.className = 'status-value status-running';

        // 立即执行一次查询
        this.checkAppStore();

        // 设置定时查询
        this.timer = setInterval(() => {
            this.checkAppStore();
            this.updateNextCheckTime(frequency);
        }, frequency * 1000);

        this.updateNextCheckTime(frequency);
    }

    stop(keepStatus = false) {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }

        this.isRunning = false;
        this.elements.startBtn.disabled = false;
        this.elements.stopBtn.disabled = true;
        
        // 如果 keepStatus 为 true，保持当前状态不变（用于查询成功的情况）
        if (!keepStatus) {
            this.elements.status.textContent = '已停止';
            this.elements.status.className = 'status-value status-stopped';
        }
        
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
        // 如果是自动加载，不添加到历史记录，但保留结果用于显示
        if (!this._isAutoLoad) {
            this.results.unshift(result); // 最新的在前面
            this.renderResults();
        } else {
            // 自动加载时，临时保存结果用于更新显示，但不渲染到历史记录
            // 这样可以在首次进入时显示版本信息
            console.log('📝 自动加载结果，不添加到历史记录');
        }
    }

    renderResults() {
        if (this.results.length === 0) {
            this.elements.resultList.innerHTML = '<div class="empty-state">暂无查询记录</div>';
            return;
        }

        // 第一条记录（最新）显示完整信息，其他记录折叠
        const html = this.results.map((result, index) => {
            const statusClass = result.isAvailable ? 'available' : 'unavailable';
            const statusText = result.isAvailable ? '✓ 已上线' : '✗ 未上线';
            const timeStr = this.formatDateTime(result.timestamp);
            const isFirst = index === 0;
            const itemId = `result-item-${index}`;
            const detailsId = `result-details-${index}`;

            // 最新版本信息（第一条记录）
            let currentVersionHtml = '';
            if (isFirst && result.isAvailable && result.appInfo) {
                currentVersionHtml = `
                    <div class="current-version">
                        <div class="version-label">当前版本</div>
                        <div class="version-value">${result.appInfo.version || '-'}</div>
                    </div>
                `;
            }

            // 详细信息（默认只显示第一条）
            let detailsHtml = '';
            if (isFirst) {
                // 第一条记录显示完整信息
                if (result.isAvailable && result.appInfo) {
                    detailsHtml = `
                        <div class="result-details" id="${detailsId}">
                            <div><strong>应用名称:</strong> ${result.appInfo.trackName || '-'}</div>
                            <div><strong>版本:</strong> ${result.appInfo.version || '-'}</div>
                            <div><strong>商店链接:</strong> <a href="${result.appInfo.trackViewUrl}" target="_blank">查看</a></div>
                        </div>
                    `;
                } else if (result.error) {
                    detailsHtml = `
                        <div class="result-details" id="${detailsId}">
                            <div style="color: #dc3545;"><strong>错误:</strong> ${result.error}</div>
                        </div>
                    `;
                } else {
                    detailsHtml = `
                        <div class="result-details" id="${detailsId}">
                            <div>应用未在 App Store 找到</div>
                        </div>
                    `;
                }
            } else {
                // 历史记录折叠显示
                if (result.isAvailable && result.appInfo) {
                    detailsHtml = `
                        <div class="result-details collapsed" id="${detailsId}" style="display: none;">
                            <div><strong>应用名称:</strong> ${result.appInfo.trackName || '-'}</div>
                            <div><strong>版本:</strong> ${result.appInfo.version || '-'}</div>
                            <div><strong>商店链接:</strong> <a href="${result.appInfo.trackViewUrl}" target="_blank">查看</a></div>
                        </div>
                    `;
                } else if (result.error) {
                    detailsHtml = `
                        <div class="result-details collapsed" id="${detailsId}" style="display: none;">
                            <div style="color: #dc3545;"><strong>错误:</strong> ${result.error}</div>
                        </div>
                    `;
                } else {
                    detailsHtml = `
                        <div class="result-details collapsed" id="${detailsId}" style="display: none;">
                            <div>应用未在 App Store 找到</div>
                        </div>
                    `;
                }
            }

            // 历史记录展开/收起按钮
            let toggleButton = '';
            if (!isFirst) {
                toggleButton = `
                    <button class="toggle-btn" data-index="${index}">
                        <span class="toggle-text">展开</span>
                        <span class="toggle-icon">▼</span>
                    </button>
                `;
            }

            return `
                <div class="result-item ${statusClass} ${isFirst ? 'current-version-item' : ''}" id="${itemId}">
                    ${currentVersionHtml}
                    <div class="result-header">
                        <span class="result-time">${timeStr}</span>
                        <span class="result-status ${statusClass}">${statusText}</span>
                    </div>
                    <div class="result-basic-info">
                        <div><strong>应用ID:</strong> ${result.appId} | <strong>国家:</strong> ${result.country}</div>
                        ${toggleButton}
                    </div>
                    ${detailsHtml}
                </div>
            `;
        }).join('');

        this.elements.resultList.innerHTML = html;
        
        // 绑定展开/收起按钮事件
        this.bindToggleButtons();
    }

    bindToggleButtons() {
        const toggleButtons = this.elements.resultList.querySelectorAll('.toggle-btn');
        toggleButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const details = this.closest('.result-item').querySelector('.result-details');
                const toggleText = this.querySelector('.toggle-text');
                const toggleIcon = this.querySelector('.toggle-icon');
                
                if (details.style.display === 'none') {
                    details.style.display = 'block';
                    toggleText.textContent = '收起';
                    toggleIcon.textContent = '▲';
                } else {
                    details.style.display = 'none';
                    toggleText.textContent = '展开';
                    toggleIcon.textContent = '▼';
                }
            });
        });
    }

    updateStatus(result) {
        // 状态更新已简化，主要显示在查询状态中
    }

    updateVersionInfo(result) {
        // 更新应用信息卡片
        this.updateAppInfoCard(result);
        
        // 更新当前版本
        if (result.isAvailable && result.appInfo && result.appInfo.version) {
            this.elements.currentVersion.textContent = result.appInfo.version;
            this.elements.currentVersion.className = 'version-secondary-value';
        } else {
            this.elements.currentVersion.textContent = '-';
            this.elements.currentVersion.className = 'version-secondary-value';
        }

        // 检查目标版本（重新读取，确保获取最新值）
        const targetVersion = this.elements.targetVersion.value.trim();
        if (targetVersion) {
            // 更新目标版本显示（确保显示内容与输入框一致）
            if (this.elements.targetVersionDisplay.textContent !== targetVersion) {
                this.elements.targetVersionDisplay.textContent = targetVersion;
            }
            
            if (result.isAvailable && result.appInfo && result.appInfo.version) {
                const currentVersion = result.appInfo.version;
                const isTargetVersionOnline = this.compareVersions(currentVersion, targetVersion);
                
                if (isTargetVersionOnline) {
                    this.elements.targetVersionStatus.textContent = '✓ 已上线';
                    this.elements.targetVersionStatus.className = 'version-main-status version-online';
                    
                    // 目标版本已上线，自动停止查询
                    if (this.isRunning) {
                        // 先更新状态显示为查询成功
                        this.elements.status.textContent = '查询成功 - 目标版本已上线';
                        this.elements.status.className = 'status-value status-running';
                        // 发送 webhook 通知
                        this.sendWebhook(result, targetVersion, currentVersion);
                        // 然后停止监控，但保持状态显示
                        this.stop(true);
                    }
                } else {
                    this.elements.targetVersionStatus.textContent = '✗ 未上线';
                    this.elements.targetVersionStatus.className = 'version-main-status version-offline';
                }
            } else {
                this.elements.targetVersionStatus.textContent = '✗ 应用未上线';
                this.elements.targetVersionStatus.className = 'version-main-status version-offline';
            }
        } else {
            this.elements.targetVersionDisplay.textContent = '-';
            this.elements.targetVersionStatus.textContent = '-';
            this.elements.targetVersionStatus.className = 'version-main-status';
        }
    }

    compareVersions(currentVersion, targetVersion) {
        // 版本号比较：当前版本 >= 目标版本，说明目标版本已上线
        const current = this.parseVersion(currentVersion);
        const target = this.parseVersion(targetVersion);
        
        for (let i = 0; i < Math.max(current.length, target.length); i++) {
            const currentPart = current[i] || 0;
            const targetPart = target[i] || 0;
            
            if (currentPart > targetPart) {
                return true; // 当前版本大于目标版本，目标版本已上线
            } else if (currentPart < targetPart) {
                return false; // 当前版本小于目标版本，目标版本未上线
            }
        }
        
        return true; // 版本号相同，已上线
    }

    parseVersion(version) {
        // 将版本号字符串转换为数字数组，例如 "4.9.1" -> [4, 9, 1]
        return version.split('.').map(part => {
            // 处理带后缀的版本号，如 "4.9.1-beta" -> 4.9.1
            const numPart = part.match(/^\d+/);
            return numPart ? parseInt(numPart[0], 10) : 0;
        });
    }

    updateAppInfoCard(result) {
        if (result.isAvailable && result.appInfo) {
            const appInfo = result.appInfo;
            
            // 显示应用信息卡片
            this.elements.appInfoPanel.style.display = 'block';
            
            // 更新应用图标
            if (appInfo.artworkUrl100 || appInfo.artworkUrl512) {
                const iconUrl = appInfo.artworkUrl512 || appInfo.artworkUrl100;
                this.elements.appIcon.src = iconUrl;
                this.elements.appIcon.style.display = 'block';
            } else {
                this.elements.appIcon.style.display = 'none';
            }
            
            // 更新应用名称
            this.elements.appName.textContent = appInfo.trackName || '-';
            
            // 更新版本信息
            if (appInfo.version) {
                this.elements.appVersion.textContent = `版本: ${appInfo.version}`;
            } else {
                this.elements.appVersion.textContent = '版本: -';
            }
            
            // 更新商店链接
            if (appInfo.trackViewUrl) {
                this.elements.appStoreLink.href = appInfo.trackViewUrl;
            } else {
                // 如果没有链接，根据 appId 构建链接
                const appId = result.appId;
                const country = result.country || 'cn';
                this.elements.appStoreLink.href = `https://apps.apple.com/${country}/app/id${appId}`;
            }
        } else {
            // 隐藏应用信息卡片
            this.elements.appInfoPanel.style.display = 'none';
        }
    }

    async sendWebhook(result, targetVersion, currentVersion) {
        const webhookUrl = this.elements.webhookUrl.value.trim();
        
        if (!webhookUrl) {
            return; // 没有配置 webhook，直接返回
        }

        try {
            const payload = {
                event: 'version_online',
                timestamp: new Date().toISOString(),
                targetVersion: targetVersion,
                currentVersion: currentVersion,
                appId: result.appId,
                country: result.country,
                appInfo: result.appInfo ? {
                    trackName: result.appInfo.trackName,
                    version: result.appInfo.version,
                    trackViewUrl: result.appInfo.trackViewUrl,
                } : null,
                message: `目标版本 ${targetVersion} 已上线！当前版本：${currentVersion}`,
            };

            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                console.log('Webhook 发送成功');
            } else {
                console.error('Webhook 发送失败:', response.status, response.statusText);
            }
        } catch (error) {
            console.error('Webhook 发送错误:', error);
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
                targetVersion: this.elements.targetVersion.value,
                webhookUrl: this.elements.webhookUrl.value,
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
                if (parsed.targetVersion) {
                    this.elements.targetVersion.value = parsed.targetVersion;
                }
                if (parsed.webhookUrl) {
                    this.elements.webhookUrl.value = parsed.webhookUrl;
                }
                this.renderResults();
                // 如果有最新结果，更新版本信息
                if (this.results.length > 0) {
                    this.updateVersionInfo(this.results[0]);
                }
            }
        } catch (error) {
            console.error('加载数据失败:', error);
        }
    }

    async autoLoadCurrentVersion() {
        // 延迟执行，确保页面完全加载
        setTimeout(async () => {
            const appId = this.elements.appId.value.trim();
            console.log('🔍 自动加载当前版本 - 应用ID:', appId, '结果数量:', this.results.length);
            
            if (!appId) {
                console.log('⚠️ 没有应用ID，跳过自动查询');
                return; // 没有应用ID，不执行查询
            }

            // 如果已经有查询结果且目标版本号已设置，不自动查询
            if (this.results.length > 0 && this.elements.targetVersion.value.trim()) {
                console.log('ℹ️ 已有查询结果和目标版本号，直接更新显示');
                // 但还是要更新版本信息显示和应用信息卡片
                this.updateVersionInfo(this.results[0]);
                return;
            }

            try {
                console.log('🚀 开始自动查询当前版本...');
                // 标记为自动加载，不增加查询次数
                this._isAutoLoad = true;
                
                // 显示加载状态
                this.elements.status.textContent = '正在获取版本信息...';
                this.elements.status.className = 'status-value';
                
                // 执行一次查询获取当前版本
                const result = await this.checkAppStore();
                console.log('📥 查询结果:', result);
                
                // 如果查询成功且有版本信息
                if (result && result.isAvailable && result.appInfo && result.appInfo.version) {
                    const currentVersion = result.appInfo.version;
                    console.log('✅ 获取到当前版本:', currentVersion);
                    
                    // 第三步：更新目标版本号
                    // 如果目标版本号为空，设置为当前版本（方便查看当前版本）
                    const targetVersionValue = this.elements.targetVersion.value.trim();
                    if (!targetVersionValue) {
                        // 设置为当前版本
                        this.elements.targetVersion.value = currentVersion;
                        // 立即更新目标版本显示
                        this.elements.targetVersionDisplay.textContent = currentVersion;
                        // 保存到本地存储
                        this.saveToStorage();
                        console.log('✅ 目标版本号已自动设置为当前版本:', currentVersion);
                    } else {
                        // 即使目标版本号已有值，也要确保显示已更新
                        this.elements.targetVersionDisplay.textContent = targetVersionValue;
                        console.log('📋 目标版本号已存在:', targetVersionValue);
                    }
                    
                    // 更新版本信息显示和应用信息卡片（这会更新目标版本状态）
                    this.updateVersionInfo(result);
                    
                    // 确保目标版本显示已正确更新（双重保险）
                    const finalTargetVersion = this.elements.targetVersion.value.trim();
                    if (finalTargetVersion && this.elements.targetVersionDisplay.textContent !== finalTargetVersion) {
                        this.elements.targetVersionDisplay.textContent = finalTargetVersion;
                    }
                    
                    // 恢复状态显示
                    this.elements.status.textContent = '未开始';
                    this.elements.status.className = 'status-value';
                    console.log('✅ 自动加载完成，版本信息已更新');
                } else {
                    // 查询失败，恢复状态
                    console.log('❌ 查询失败或应用未上线');
                    this.elements.status.textContent = '未开始';
                    this.elements.status.className = 'status-value';
                }
                
                // 重置标记
                this._isAutoLoad = false;
            } catch (error) {
                console.error('❌ 自动加载当前版本失败:', error);
                this.elements.status.textContent = '未开始';
                this.elements.status.className = 'status-value';
                this._isAutoLoad = false;
            }
        }, 800); // 延迟800ms执行，确保DOM完全加载
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new AppStoreMonitor();
});

