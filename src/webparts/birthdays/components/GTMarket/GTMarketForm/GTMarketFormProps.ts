import { Moment } from "moment";
import { ISiteUserInfo } from "@pnp/sp/site-users/types";
import { WebPartContext } from "@microsoft/sp-webpart-base";

export interface GTMarketFormProps {
    creationDate: Moment | null;//input value or today date
    itemName: string;
    creatorName: string;//input value or current user
    itemId: number;// 0 for new items(add), otherwise update
    CurrentUser: ISiteUserInfo;
    itemDescription: string;
    phoneNumber: string;
    email: string;//input or email from the current user
    image: string | null;//current image or empty for new
    imageId: number | null;//id if exist for edit, null for new
    open: boolean;
    closeForm: () => void;
    context: WebPartContext;
    GTMarketListId: string;
    GTMarketImagesListId: string;
}