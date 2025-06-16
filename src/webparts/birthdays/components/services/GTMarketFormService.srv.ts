import * as moment from "moment";
import { GTMarketFormErrors, GTMarketFormType } from "../Models/Types";
import { ISiteUserInfo } from "@pnp/sp/site-users/types";
import { WebPartContext } from "@microsoft/sp-webpart-base";
import getSP from "../../../PnPjsConfig";
import { Web } from "@pnp/sp/webs";
import { spfi, SPFI } from "@pnp/sp";
import "@pnp/sp/files";
import "@pnp/sp/folders";
import { Item } from "@pnp/sp/items";

const requiredFields: (keyof GTMarketFormErrors)[] = [
    "itemName",
    "creatorName",
    "itemDescription",
    "phoneNumber",
    "email"]

interface UpdateObject {
    itemName: string;
    Description: string;
    phoneNumber: string;
    email: string;
    creatorName: string;
    imgId?: number;
}

export function isValid(errors: GTMarketFormErrors) {
    return !requiredFields.some(field => errors[field]);
}


export function checkErrors(value: string | null | moment.Moment | ISiteUserInfo | number) {
    if (!value) {
        return true;
    }
    let isError: boolean;
    if (typeof value === 'string') {
        isError = value.trim() === '';
    } else if (value === null) {
        isError = true;
    } else if (moment.isMoment(value)) {
        isError = !value.isValid();
    } else {
        isError = false;
    }
    return isError;
}

function checkFileType() {
    const input = document.getElementById('imageUploader') as HTMLInputElement;
    if (!input) {
        return false;;
    }
    const file = input.files?.[0];
    if (!file) return false;

    if (!file.type.startsWith('image/')) {
        alert('רק קבצי תמונה מותרים');
        input.value = '';
        return false;
    }
    return true;

}


export async function submitForm(
    context: WebPartContext,
    formData: GTMarketFormType,
    errors: GTMarketFormErrors,
    GTMarketListId: string,
    GTMarketImagesListId: string
) {
    console.log("form data: ", formData);


    if (!isValid(errors) || !formData) {
        return false;
    }

    const sp = getSP(context);

    let updateObject = {
        itemName: formData.itemName,
        Description: formData.itemDescription,
        phoneNumber: formData.phoneNumber,
        email: formData.email,
        creatorName: formData.creatorName,
        imgId: formData.imageId || null
    };

    if (formData.imageFile !== null) {
        if (!checkFileType()) {
            return false; // illegal file type
        }
        const fileBuffer = await formData.imageFile.arrayBuffer()
        try {
            // random uuid in order to allow duplications
            const uploadResult = await sp.web.lists.getById(GTMarketImagesListId)
                .rootFolder.files.addUsingPath(crypto.randomUUID(), fileBuffer);

            const item = await uploadResult.file.getItem().then(Item => console.log("item id: ", Item))

        }
        catch (err) {
            console.error("Error uploading image:", err);
            return false;
        }
    }

    try {
        await sp.web.lists.getById(GTMarketListId).items.add(updateObject);
        return true;
    }
    catch (err) {
        console.error("An error occurred during adding file: ", err);
        return false;
    }
}
