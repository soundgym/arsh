import ITaskConfig from "./ITaskConfig";
import * as admin from "firebase-admin";
import IReview from "./IReview";
import axios from 'axios';

export default abstract class INotifier {
    config:ITaskConfig;
    reviews?:IReview[];
    appInfo:{
        name?:string;
        icon?:string;
        version?:string;
    } = {};

    constructor(config:ITaskConfig){
        this.config = config;
    }

    abstract init():Promise<void>;
    abstract fetchData():Promise<void>;

    public async execute(){
        try {
            if (!this.reviews) {
                throw Error('fetch reviews first');
            }

            const count = await this.getTaskCount();
            if (count === 0) {

                //check all review as marked
                for (let i = 0; i < this.reviews.length; i++) {
                    await this.markAsPublished(this.reviews[i])
                }
            } else {
                //publish review
                for (let i = 0; i < this.reviews.length; i++) {
                    const currentReview = this.reviews[i];

                    const isPublishedReview = await this.isPublished(currentReview);

                    if (isPublishedReview) {
                        continue;
                    }

                    try {
                        await this.publish(currentReview);
                        await this.markAsPublished(currentReview);
                    } catch (e) {
                        console.warn('review publish failed', currentReview.id);
                    }
                }
            }

            await this.increaseTaskCount(count);
        } catch(error) {
            console.error('Error on INotifier.execute()', error.message);
            throw error;
        }
    }

    async getTaskCount():Promise<number>{
        const snapshot = await admin.database().ref(`taskCounter/${this.config.taskId}`).once('value');
        return snapshot.val() || 0;
    }

    async increaseTaskCount(count:number){
        return admin.database().ref(`taskCounter/${this.config.taskId}`).set(count+1);
    }

    async publish(review:IReview){
        const notification = this.buildSlackNotification(review);

        return axios({
            url: this.config.hookURL,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            method: 'post',
            data: notification
        })
    }

    async isPublished(review:IReview){
        const snapshot = await admin.database().ref(`publishedReview/${this.config.taskId}/${review.id}`).once('value');
        return snapshot.val() || false;
    }

    async markAsPublished(review:IReview){
        return admin.database().ref(`publishedReview/${this.config.taskId}/${review.id}`).set(true);
    }

    private buildSlackNotification(review:IReview){
        let title = Array(review.rating).fill(":star:").join("");
        if(review.title){
            title += review.title;
        }

        let footer = `v${review.version}`;
        if(review.versionCode){
            footer += `(${review.versionCode})`;
        }
        if(review.osVersion){
            footer += ` ${this.config.platform} ${review.osVersion}`;
        }
        if(review.device){
            footer += `, ${review.device}`;
        }
        if(review.link){
            footer += ` - <${review.link}|${this.appInfo.name}, ${review.storeName}>`;
        } else {
            footer += ` - ${this.appInfo.name}, ${review.storeName}`;
        }

        return {
            mrkdwn:true,
            text:`${this.appInfo.name} : 새로운 리뷰가 작성됐습니다.`,
            attachments: [
                {
                    fallback: ":star:새로운 앱 리뷰!",
                    color:"#ff993d",
                    author_name:review.author,
                    title:title,
                    text:review.text,
                    footer: footer,
                    footer_icon: this.appInfo.icon,
                    ts: Date.now()/1000
                }
            ]
        }
    }
}
