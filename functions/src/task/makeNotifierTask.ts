import ITaskConfig, {Platform} from "../interface/ITaskConfig";
import {AndroidNotifier, IOSNotifier} from '../notifier';

export default function makeNotifiers(configs:ITaskConfig[]){
    return configs.map(config => {
        switch(config.platform){
            case Platform.android:
                return new AndroidNotifier(config);
            case Platform.ios:
                return new IOSNotifier(config);
        }
    });
}
