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
    image: string | null;
    imageId: number | null;
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
    imageId: number | null;
}