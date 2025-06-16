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
import { openErrorModal } from "./SwalUtils";

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
        input.value = '';
        return false;
    }
    return true;
}

function validateFields(data: GTMarketFormType) {
    const formErrors: GTMarketFormErrors = {
        creationDate: false,
        creatorName: false,
        email: false,
        itemDescription: false,
        itemName: false,
        phoneNumber: false
    }
    requiredFields.forEach(field => formErrors[field] = checkErrors(data[field]))
    return formErrors;
}




export async function submitForm(
    context: WebPartContext,
    formData: GTMarketFormType,
    GTMarketListId: string,
    GTMarketImagesListId: string,
    updateErrors: (errors: GTMarketFormErrors) => void
) {
    console.log("form data: ", formData);

    const errors = validateFields(formData)
    console.log("erorrs: ", errors);

    if (!formData || !isValid(errors)) {
        updateErrors(errors);
        openErrorModal("הטופס אינו תקין");
    }

    const sp = getSP(context);

    let updateObject = {
        itemName: formData.itemName,
        Description: formData.itemDescription,
        phoneNumber: formData.phoneNumber,
        email: formData.email,
        creatorName: formData.creatorName,
    };

    if (formData.imageFile !== null) {
        if (!checkFileType()) {
            openErrorModal("סוג הקובץ אינו תמונה")
            return 401; // illegal file type
        }

        try {
            const fileBuffer = await formData.imageFile.arrayBuffer();
        }
        catch (err) {
            console.error("Error uploading image:", err);
            openErrorModal("העלאת התמונה נכשלה")
            return 402;
        }
    }

    try {
        await sp.web.lists.getById(GTMarketListId).items.add(updateObject);
        return 200;
    }
    catch (err) {
        console.error("An error occurred during adding file: ", err);
        openErrorModal("העלאת הקובץ נכשלה")
        return 403;
    }
}
