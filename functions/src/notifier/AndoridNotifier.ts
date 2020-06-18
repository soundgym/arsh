import {google} from "googleapis";
import _ from 'lodash';
//@ts-ignore
import scraper from "google-play-scraper";

import INotifier from "../interface/INotifier";

export default class AndroidNotifier extends INotifier {
    init():Promise<void> {
        return scraper.app({appId: this.config.appId})
            .then((appData:any) => {
                if(appData){
                    this.appInfo.name = appData.title;
                    this.appInfo.icon = appData.icon;
                    this.appInfo.version = appData.version;
                } else {
                    throw Error('there is no app data')
                }
            })
            .catch((error:Error) => {
                console.error('Error on AndroidNotifier.init()', error.message);
                throw error;
            })
    }

    fetchData():Promise<void> {
        if(!this.config.publisherKey){
            throw Error('there is no publisher key')
        }

        const jwt = new google.auth.JWT(
            this.config.publisherKey.client_email,
            undefined,
            this.config.publisherKey.private_key,
            ["https://www.googleapis.com/auth/androidpublisher"],
        );

        return jwt.authorize()
            .then(credentials => {
                return google.androidpublisher('v3').reviews.list({
                    auth:jwt,
                    packageName:this.config.appId
                })
            })
            .then(({data}) => {
                if(!data.reviews){
                    this.reviews = [];
                    return;
                }

                this.reviews = _.compact(data.reviews.map(review => {
                    const comment = review.comments?.[0].userComment;

                    if (!comment) {
                        return null;
                    }

                    return {
                        id: review.reviewId || undefined,
                        author: review.authorName || undefined,
                        version: comment.appVersionName || undefined,
                        versionCode: comment.appVersionCode || undefined,
                        osVersion: comment.androidOsVersion || undefined,
                        device: comment.deviceMetadata?.productName || undefined,

                        text: comment.text || undefined,
                        rating: comment.starRating || undefined,
                        link: `https://play.google.com/store/apps/details?id=${this.config.appId}&reviewId=${review.reviewId}`,
                        storeName: 'Google Play'
                    };
                }));

                return;
            }).catch(error => {
                console.error('Error on AndroidNotifier.fetchData()', error.message);
                throw error;
            })
    }
}
