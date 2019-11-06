export default interface IReview {
    title?: string;
    id?: string;
    author?: string;
    version?: string;
    versionCode?: number;
    osVersion?: number;
    device?: string;

    text?: string
    rating?: number;
    link: string;
    storeName: string;
}
