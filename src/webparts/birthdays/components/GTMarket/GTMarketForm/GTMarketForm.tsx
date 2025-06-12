import * as React from 'react';
import styles from './GTMarketForm.module.scss';
import { GTMarketFormProps } from './GTMarketFormProps';
import { GTMarketFormType } from '../../Models/Types';
import * as moment from 'moment';

export default function GTMarketForm(props: GTMarketFormProps) {
    const [formData, setFormData] = React.useState<GTMarketFormType>();

    React.useEffect(() => {
        init();
    }, [])

    function init() {
        setFormData(createDynammicForm);
    }

    function createDynammicForm() {
        const form: GTMarketFormType = {
            creationDate: props.creationDate ? props.creationDate : moment(),
            creatorName: props.creatorName !== "" ? props.creatorName : props.CurrentUser?.Title || "",
            email: props.email !== "" ? props.email : props.CurrentUser?.Email || "",
            CurrentUser: props.CurrentUser,
            image: props.image ? props.image : null,
            imageId: props.imageId ? props.imageId : null,
            itemDescription: props.itemDescription ? props.itemDescription : "",
            itemId: props.itemId ? props.itemId : 0,
            phoneNumber: props.phoneNumber ? props.phoneNumber : "",
            itemName: props.itemName ? props.itemName : ""
        }
        return form;
    }

    return (
        <div className={styles.modalBackGround} onClick={props.closeForm}>
            <div className={styles.modalScreen} onClick={(event) => { event.stopPropagation() }}>

            </div>
        </div>
    )
}
