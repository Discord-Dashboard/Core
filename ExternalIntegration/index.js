class Client {
    constructor({url,token}) {
        this.url = url;
        try {
            //connect with socket using url specified
        }catch(err){
            throw new TypeError('Discord-Dashboard External Integration failure: URL specified is wrong or token specified is wrong.');
        }
    }

    socket: ()=>{
        //socket with 'settingUpdated', 'settingRequested'
    }
}

class Server {
    constructor(config) {
        this.app = ()=>{};
        this.server = ({io,server,config,themeConfig}) => {
            const ExternalSocket = io.of('/externalIntegration');
            ExternalSocket.on('settingUpdated', (data) => {
                console.log(`${data.action} got updated: ${JSON.stringify(data.)}`);
            });
            return ExternalSocket;
        };
        this.server.on('settingRequested', (data)=>{
            console.log(`${data.option} has been requested.`);
        });
    };

    UpdatedSettingEmit: (data)=>{
        this.server.emit('settingUpdated', data);
    };

    RequestDataEmit: (data)=>{
        this.server.emit('settingsRequested', data);
    }
};

module.exports = {
    Client,
    Server,
};
