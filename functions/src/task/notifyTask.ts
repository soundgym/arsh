import INotifier from "../interface/INotifier";
import {IOSNotifier, AndroidNotifier} from "../notifier";
import moment from 'moment';

type Notifier = INotifier | AndroidNotifier | IOSNotifier;

export default function notifyToSlack(notifiers:Notifier[]){
    if(notifiers.length > 0){
        const notifier = notifiers.pop();

        if(!notifier){
            return console.warn('Notifier is empty');
        }

        return notifier.init()
            .then(() => {
                return notifier.fetchData()
            })
            .then(() => {
                return notifier.execute()
            })
            .then(() => {
                return console.info(`Notify to slack success (${moment().format('YYYY.MM.DD HH:mm:ss')}): `, notifier.config.taskId);
            })
            .catch(e => {
                return console.warn('Notify to slack failed: ', e.message);
            })

    } else {
        console.info(`Notify to slack Promise pool will finish (${moment().format('YYYY.MM.DD HH:mm:ss')})`);
        return undefined;
    }
}
