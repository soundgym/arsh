import INotifier from "../interface/INotifier";
import axios from 'axios';
import IReview from "../interface/IReview";

export default class IOSNotifier extends INotifier {
    init(): Promise<void> {
        return fetchAppData(this.config.appId)
            .then(appData => {
                this.appInfo.name = appData.trackCensoredName;
                this.appInfo.version = appData.version;
                this.appInfo.icon = appData.artworkUrl100;
            })
    }

    fetchData(): Promise<void> {
        return fetchAppReviews(this.config.appId).then(reviews => {
            this.reviews = reviews;
        })
    }
}

function fetchAppData(appId:string){
    const url = `https://itunes.apple.com/lookup?id=${appId}`;

    return axios.get(url).then(({data}) => {
        const appData = data.results?.[0];

        if(appData){
            return appData;
        } else {
            throw Error('there is no app data')
        }
    });
}

function fetchAppReviews(appId:string):Promise<IReview[]> {
    const krURL = `https://itunes.apple.com/kr/rss/customerreviews/page=1/id=${appId}/sortBy=mostRecent/json`;
    // const usURL = `https://itunes.apple.com/us/rss/customerreviews/page=1/id=${appId}}/sortBy=mostRecent/json`;

    return axios.get(krURL)
        .then(({data}) => {
            const entries = data.feed.entry;

            return entries
                .filter((r: any) => !(r && r['im:name']))
                .map((review: any) => {

                    return {
                        id: review.id?.label || undefined,
                        version: review?.['im:version']?.label || undefined,

                        author: review.author?.name?.label || undefined,
                        title: review.title?.label || undefined,
                        text: review.content?.label || undefined,
                        rating: parseInt(review?.['im:rating']?.label) || undefined,
                        link: review.link?.attributes?.href,
                        storeName: 'App Store'
                    };
                });
        })
        .catch(()=>{
            return [];
        })
}
