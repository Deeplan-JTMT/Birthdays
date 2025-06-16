import * as React from 'react';
import styles from './GTMarketForm.module.scss';
import { GTMarketFormProps } from './GTMarketFormProps';
import { GTMarketFormErrors, GTMarketFormType } from '../../Models/Types';
import * as moment from 'moment';
import TextField from '@mui/material/TextField';
import { ISiteUserInfo } from '@pnp/sp/site-users/types';
import { AiOutlineSend } from "react-icons/ai";
import { IoCloseCircleOutline } from "react-icons/io5";
import { Button } from '@mui/material';
import { checkErrors, submitForm } from '../../services/GTMarketFormService.srv';
import Swal from 'sweetalert2';
import { DatePicker } from '@material-ui/pickers';
const SendIcon = AiOutlineSend as unknown as React.FC<React.SVGProps<SVGSVGElement>>;
const closeCircle = IoCloseCircleOutline as unknown as React.FC<React.SVGProps<SVGSVGElement>>;

export default function GTMarketForm(props: GTMarketFormProps) {
    const [formData, setFormData] = React.useState<GTMarketFormType>(createDynammicForm);
    const [errors, setErrors] = React.useState<GTMarketFormErrors>(createInitialErrors);

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
            itemName: props.itemName ? props.itemName : "",
            imageFile: null
        }
        return form;
    }

    function createInitialErrors() {
        const formErrors: GTMarketFormErrors = {
            creationDate: false,
            creatorName: false,
            email: false,
            itemDescription: false,
            itemName: false,
            phoneNumber: false
        }
        return formErrors;
    }

    const handleChange = <K extends keyof GTMarketFormType>(key: K, value: GTMarketFormType[K]) => {
        setErrors(prev => {
            if (!prev) return prev
            return {
                ...prev,
                [key]: checkErrors(value) || false
            }
        })
        setFormData(prev => {
            if (!prev) return prev; // Handle case where prev is undefined
            return {
                ...prev,
                [key]: value
            };
        });
    };

    const closeFormConfirmation = () => {
        Swal.fire({
            title: 'האם לסגור את החלון?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'סגירה',
            cancelButtonText: 'ביטול',
            customClass: {
                container: 'swal'
            }
        }).then(result => {
            if (result.isConfirmed) {
                props.closeForm();
            }
        });
    }

    const changeImage = (file: any) => {
        console.log("file: ", file);
        setFormData(prev => ({
            ...prev,
            "imageFile": file[0]
        }))
    }

    return (
        <div className={styles.modalBackGround} onClick={props.closeForm}>
            <div className={styles.modalScreen} onClick={(event) => { event.stopPropagation() }}>
                <div className={styles.header}>טופס הוספת מוצר</div>
                <div className={styles.formContainer}>
                    <TextField
                        error={errors?.creatorName}
                        required
                        disabled={!!props.CurrentUser}//if the current user did not received well, the user will be able to fill it by himself
                        label="שם המפרסם"
                        defaultValue={props.CurrentUser.Title || ""}
                        name='creatorName'
                        onChange={(event) => handleChange('creatorName', event.target.value)}
                    />
                    <TextField
                        error={errors?.email}
                        required
                        disabled={!!props.CurrentUser}//if the current user did not received well, the user will be able to fill it by himself
                        label="אימייל המפרסם"
                        defaultValue={props.CurrentUser.Email || ""}
                        name='email'
                        onChange={(event) => handleChange('email', event.target.value)}
                    />
                    <TextField
                        error={errors?.itemName}
                        required
                        label="שם המוצר"
                        defaultValue={props.itemName || ""}
                        name='itemName'
                        onChange={(event) => handleChange('itemName', event.target.value)}
                    />
                    <TextField
                        error={errors?.itemDescription}
                        required
                        multiline
                        label="תיאור המוצר"
                        defaultValue={props.itemDescription || ""}
                        name='itemDescription'
                        onChange={(event) => handleChange('itemDescription', event.target.value)}
                    />
                    <TextField
                        required
                        error={errors?.phoneNumber}
                        label="מספר טלפון"
                        defaultValue={props.phoneNumber || ""}
                        name='phoneNumber'
                        onChange={(event) => handleChange('phoneNumber', event.target.value)}
                    />
                    <input type='file' aria-label='צרף תמונה' onChange={(e) => changeImage(e.target.files)} accept='image/*' id='imageUploader' />

                </div>
                <div className={styles.buttonsContainer}>
                    <Button
                        variant="contained"
                        id="Popover1"
                        color="error"
                        onClick={closeFormConfirmation}>
                        ביטול
                    </Button>
                    <Button
                        variant="contained"
                        style={{ backgroundColor: "#84C792" }}
                        type="submit"
                        onClick={() => submitForm(props.context, formData, errors, props.GTMarketListId, props.GTMarketImagesListId)}
                    >
                        שמירה
                    </Button>
                </div>
            </div>
        </div >
    )
}
