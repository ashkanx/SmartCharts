import { getUTCEpoch, getLocalDate, getUTCDate } from './index';
import PendingPromise from './PendingPromise';

class ServerTime {
    static _instance;

    clockStarted = false;
    clockStartedPromise = new PendingPromise();

    async init(api) {
        this._api = api;
        if (!this.clockStarted) {
            this.clockStarted = true;
            clearInterval(this.getTimeInterval);
            await this.requestTime();
            this.getTimeInterval = setInterval(this.requestTime.bind(this), 30000);
        } else {
            return this.clockStartedPromise;
        }
    }

    async requestTime() {
        this.clientTimeAtRequest = getUTCEpoch(new Date());
        await this._api.getServerTime().then(this._timeResponse);
        this.clockStartedPromise.resolve();
    }

    _timeResponse = (response) => {
        if (response.error) {
            this.clockStarted = false;
        }

        if (!this.clockStarted) {
            this.init();
            return;
        }

        const serverTime = response.time;
        const clientTimeAtResponse = getUTCEpoch(new Date());
        this.serverTimeAtResponse = serverTime + ((clientTimeAtResponse - this.clientTimeAtRequest) / 2);

        const updateTime = () => {
            this.serverTimeAtResponse += 1;
        };

        clearInterval(this.updateTimeInterval);
        this.updateTimeInterval = setInterval(updateTime, 1000);
    }

    getEpoch() {
        if (this.serverTimeAtResponse) {
            return this.serverTimeAtResponse;
        }

        throw new Error('Server time is undefined!');
    }

    getLocalDate() {
        return getLocalDate(this.getEpoch());
    }

    getUTCDate() {
        return new Date(getUTCDate(this.getEpoch()));
    }

    static getInstance() {
        if (!this._instance) {
            this._instance = new ServerTime();
        }

        return this._instance;
    }
}

export default ServerTime;
