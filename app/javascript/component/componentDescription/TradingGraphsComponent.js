export default class TradingGraphsComponent {
    constructor(element, historyDataSource, subscriptionDataSource) {
        this.historyDataSource = historyDataSource
        this.subscriptionDataSource = subscriptionDataSource
        this.container = element;
        this.lastBar = null
        this.config = this.configuration();
        this.lastData = null;
        this.widget = null;
        this.wrapper = document.createElement('div');
        if (this.historyDataSource && 'getInterval' in this.historyDataSource) {
            this.interval = this.historyDataSource.getInterval()
        } else if (this.subscriptionDataSource && 'getInterval' in this.subscriptionDataSource) {
            this.interval = this.subscriptionDataSource.getInterval()
        } else {
            this.interval = '15'
        }
        this.onHistoryCallback = undefined
        this.onRealtimeCallback = undefined
        this.periodParams = undefined
        this.minuteIntervals = {
            '1D': 24 * 60,
            '2D': 2 * 24 * 60,
            '3D': 3 * 24 * 60,
            'W': 7 * 24 * 60,
            '3W': 3 * 7 * 24 * 60,
            'M': 30 * 24 * 60,
            '6M': 6 * 30 * 24 * 60
        }
    }

    initWidget() {
        const configurationData = {
            supports_marks: true,
            supports_timescale_marks: true,
            supports_time: true,
            supported_resolutions: ['1', '5', '15', '30', '60', '1D', '2D', '3D', '1W', '3W', '1M', '6M'],
        };
        this.widget = new TradingView.widget({
            container: this.wrapper,
            locale: 'en',
            symbol: this.config.symbol,
            interval: this.interval,
            disabled_features: ['header_symbol_search', 'header_compare'],
            fullscreen: false,
            autosize: true,
            debug: false,
            library_path: '/charting_library/',
            time_frames: [
                {text: '1D', resolution: '15', description: '1 Day'},
                {text: '5D', resolution: '60', description: '5 Days'},
                {text: '1M', resolution: '60', description: '1 Month'},
                {text: '3M', resolution: '60', description: '3 Months'},
                {text: '6M', resolution: '1W', description: '6 Months'},
                {text: '1Y', resolution: '1M', description: '1 Year'},
                {text: '3Y', resolution: '6M', description: '3 Years'},
            ],
            datafeed: {
                onReady: callback => {
                    setTimeout(() => callback(configurationData));
                },
                resolveSymbol: (symbolName, onSymbolResolvedCallback, onResolveErrorCallback, extension) => {
                    setTimeout(() => {
                        const symbolInfo = {
                            name: symbolName,
                            description: '',
                            session: '24x7',
                            timezone: 'Etc/UTC',
                            has_intraday: true,
                            has_seconds: true,
                            has_daily: true,
                            has_ticks: true,
                            minmov: 1,
                            pricescale: 100000,
                            has_empty_bars: true,
                            data_status: 'streaming',
                        };
                        onSymbolResolvedCallback(symbolInfo);
                    }, 0);
                },
                getBars: async (symbolInfo, resolution, periodParams, onHistoryCallback, onErrorCallback, firstDataRequest) => {
                    if (this.historyDataSource) {
                        this.interval = resolution;
                        this.onHistoryCallback = onHistoryCallback
                        this.periodParams = periodParams
                        this.historyDataSource.setCallback(this.onHistoryData.bind(this))
                        const till = new Date().toISOString().slice(0, 10);
                        const tillDate = new Date(till);
                        const minutesInterval = this.getIntervalInMinutes(resolution)
                        const from = new Date(tillDate.getFullYear(), tillDate.getMonth() - Math.floor(minutesInterval / 5), tillDate.getDate() - (minutesInterval == 1 ? 5 : minutesInterval == 5 ? 0 : 0)).toISOString().slice(0, 10)
                        const deltaVariables = {
                            from, till,
                            interval: `${minutesInterval}`,
                            limit: '9990'
                        }
                        this.historyDataSource.changeVariables(deltaVariables)
                    } else {
                        onHistoryCallback([], {noData: true})
                    }
                },
                subscribeBars: async (symbolInfo, resolution, onRealtimeCallback, subscriberUID, onResetCacheNeededCallback) => {
                    if (this.subscriptionDataSource) {
                        this.onRealtimeCallback = onRealtimeCallback
                        const interval = `${this.getIntervalInMinutes(resolution)}`
                        this.subscriptionDataSource.setCallback(this.onSubscriptionData.bind(this))
                        await this.subscriptionDataSource.changeVariables({interval})
                    }
                },
                unsubscribeBars: () => {
                },
            }
        });
    }

    onHistoryData(data) {
        if (this.config.title && data) {
            this.getTitle(data)
        }
        const compatibleData = this.composeBars(data, this.periodParams);
        this.lastBar = compatibleData.at(-1)
        compatibleData.length > 0 ? this.onHistoryCallback(compatibleData, {noData: false}) : this.onHistoryCallback([], {noData: true});
    }

    onSubscriptionData(data) {
        const newBar = this.composeBars(data)[0]
        const bar = this.getNextBar(this.lastBar, newBar)
        this.lastBar = {...bar}
        this.onRealtimeCallback(bar)
    }

    init(widgetFrame) {
        if (document.querySelector('#switchButton') && document.querySelector('#streamControlButton') && document.querySelector('#mempoolControlButton') && document.querySelector('#getMempoolButton')) {
            widgetFrame.switchButton.style.display = 'none'
            widgetFrame.streamControlButton.style.display = 'none'
            widgetFrame.mempoolControlButton.style.display = 'none'
            widgetFrame.getMempoolButton.style.display = 'none'
            widgetFrame.switchButton.parentElement.lastChild.classList.remove('invisible')
        }

        if (this.widget === null) {
            this.wrapper.style.height = '600px';
            this.container.appendChild(this.wrapper);
            this.initWidget();
        }
    }

    getIntervalInMinutes(resolution) {
        return isNaN(+resolution) ? this.minuteIntervals[resolution] : resolution
    }

    getNextBar(lastBar, newBar) {
        let bar
        if (!this.lastBar) {
            return newBar
        }
        if (newBar.time > lastBar.time) {
            //create new bar
            bar = {
                time: newBar.time,
                open: lastBar.close,
                high: newBar.high,
                low: newBar.close,
                close: newBar.close,
                volume: newBar.volume
            }
        } else {
            //update bar
            bar = {
                ...lastBar,
                high: Math.max(lastBar.high, newBar.high),
                low: Math.min(lastBar.low, newBar.low),
                close: newBar.close,
                volume: lastBar.volume + newBar.volume
            }
        }
        return bar
    }

    composeBars(data, periodParams) {
        console.log('data:', data)
        console.log('data typeof:', typeof data)
        console.log('this.config.topElement(data):', this.config.topElement(data))
        console.log('this.config.topElement(data) typeof:', typeof this.config.topElement(data))
        if (!this.config.topElement(data)) {
            console.warn('no this.config.topElement(data)');
            return
        }
        const tradeBlock = this.config.topElement(data)

        tradeBlock.sort((a, b) => new Date(a.Block.Time).getTime() - new Date(b.Block.Time).getTime());

        if (tradeBlock.length === 0) {
            console.warn('no data');
            return [];
        }

        try {
            return tradeBlock.filter(trade => trade.Block && trade.Trade)
                .reduce((resultData, trade, i, array) => {
                    const time = new Date(trade.Block.Time).getTime();
                    if (!periodParams || (time / 1000) >= periodParams.from && (time / 1000) < periodParams.to) {
                        const previousTrade = array[i - 1];
                        const previousClose = previousTrade ? previousTrade.Trade.close : trade.Trade.open;
                        resultData.push({
                            time,
                            low: trade.Trade.low,
                            high: trade.Trade.high,
                            open: previousClose,
                            close: trade.Trade.close,
                            volume: parseFloat(trade.volume)
                        });
                    }
                    return resultData;
                }, []);
        } catch (error) {
            console.error('Data is empty:', error);
            return [];
        }
    }


    async getTitle(data) {
        if (this.config && this.config.title && this.config.id) {

            const divTitle = document.querySelector(`.\\#${this.config.id}`)
            if (divTitle) {
                const textNode = document.createTextNode(this.config.title(data))
                divTitle.textContent = ''
                divTitle.appendChild(textNode)
            }
        }
    }
}
