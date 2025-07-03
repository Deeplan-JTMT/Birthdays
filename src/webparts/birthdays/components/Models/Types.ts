import { Moment } from "moment";
import { ISiteUserInfo } from "@pnp/sp/site-users/types";

export type GTMessageType = {
    creationDate: string;
    itemName: string;
    creatorName: string;
    itemId: number;
    CurrentUser: ISiteUserInfo;
    itemDescription: string;
    phoneNumber: string;
    email: string;
    Image: string | null;
    // imageId: number | null;
    stopTimer: () => void;
    resumeTimer: () => void;
}

export type GTMarketFormType = {
    creationDate: Moment | null;
    itemName: string;
    creatorName: string;
    itemId: number;
    CurrentUser: ISiteUserInfo;
    itemDescription: string;
    phoneNumber: string;
    email: string;
    image: string | null;
    // imageId: number | null;
    imageFile: any;
}

export type GTMarketFormErrors = {
    creationDate: boolean;
    itemName: boolean;
    creatorName: boolean;
    itemDescription: boolean;
    phoneNumber: boolean;
    email: boolean;
}