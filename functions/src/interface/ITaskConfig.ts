export enum Platform {
    android = 'Android',
    ios = 'iOS'
}

export default interface ITaskConfig {
    ownerId:string;
    taskId:string;

    hookURL:string;
    platform:Platform;
    appId:string;
    publisherKey?:{
        type:string;
        project_id:string;
        private_key_id:string;
        private_key:string;
        client_email:string;
        client_id:string;
        auth_uri:string;
        token_uri:string;
        auth_provider_x509_cert_url:string;
        client_x509_cert_url:string;
    },
    regions?:string[] | boolean
}
