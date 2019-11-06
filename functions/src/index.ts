import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import PromisePool from 'es6-promise-pool'
import fetchConfigs from "./task/fetchConfigsTask";
import notifyToSlack from "./task/notifyTask";
import makeNotifiers from "./task/makeNotifierTask";
import account from './config/adminAccount.json';
import moment from "moment";
import 'moment-timezone';

//@ts-ignore
moment.tz.setDefault('Asia/Seoul');
const MAX_CONCURRENT = 5;

admin.initializeApp({
    credential: admin.credential.cert({
        projectId:account.project_id,
        privateKey:account.private_key,
        clientEmail:account.client_email
    }),
    databaseURL: "https://arsh-apps.firebaseio.com"
});

exports.reviewNotifier = functions.pubsub.schedule('every 6 minutes').onRun(async context => {
    console.info(`Notifier Task start at ${moment().format('YYYY.MM.DD HH:mm:ss')}`);

    const taskConfigs = await fetchConfigs();
    const notifiers = makeNotifiers(taskConfigs);
    console.info('notifiers length:',notifiers.length);

    const promisePool = new PromisePool(() => notifyToSlack(notifiers), MAX_CONCURRENT);
    await promisePool.start();

    console.info(`Notifier Task finished at ${moment().format('YYYY.MM.DD HH:mm:ss')}`);
    return null;
});
