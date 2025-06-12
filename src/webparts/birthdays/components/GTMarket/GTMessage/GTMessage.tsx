import * as React from 'react';
import styles from './GTMessage.module.scss';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import {
    Delete as DeleteIcon,
    Phone as PhoneIcon,
    Email as EmailIcon,
    Image as ImageIcon
} from '@mui/icons-material';
import { ISiteUserInfo } from '@pnp/sp/site-users/types';
import Swal from 'sweetalert2';


interface GTMessageProps {
    creationDate: string;
    itemName: string;
    creatorName: string;
    itemId: number;
    CurrentUser: ISiteUserInfo | undefined;
    itemDescription: string;
    phoneNumber: string;
    email: string;
    image: string | null;
    imageId: number | null;
    removeItem: (itemId: number, imageId: number | null) => void;
    updateOverFlow: () => void;
}

export default function GTMessage(props: GTMessageProps) {

    function openImage() {
        Swal.fire({
            title: props.itemName,
            imageUrl: props.image,   // can be data-URI, blob, etc.
            imageWidth: 600,                           // optional sizing
            imageHeight: 400,
            imageAlt: props.itemName,
            confirmButtonText: "סגירה"
        });
    }

    function openDeleteConfirmationModal() {
        Swal.fire({
            title: 'האם למחוק את הפוסט?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'מחיקה',
            cancelButtonText: 'ביטול'
        }).then(result => {
            if (result.isConfirmed) {
                props.removeItem(props.itemId, props.imageId);            // ← runs ONLY on confirmation
            }
        });
    }

    return (
        <div className={styles.messageContainer} onClick={props.updateOverFlow}>
            <div className={styles.upperRow}>
                <div className={styles.creationDate}>
                    פורסם בתאריך {props.creationDate}:
                </div>
                <div className={styles.buttonsContainer}>
                    {props.CurrentUser && props.CurrentUser.Title === props.creatorName &&//hide the delete button when the current use watch a post he didn't write
                        < Tooltip title="הסר מוצר" arrow>
                            <IconButton aria-label="הסר מוצר"
                                onClick={openDeleteConfirmationModal}>
                                <DeleteIcon />
                            </IconButton>
                        </Tooltip>
                    }

                    < Tooltip title={props.phoneNumber} arrow>
                        <IconButton aria-label={props.phoneNumber}>
                            <PhoneIcon />
                        </IconButton>
                    </Tooltip>

                    < Tooltip title="פנייה במייל" arrow>
                        <IconButton aria-label="פנייה במייל" href={`mailto:${props.email}`}>
                            <EmailIcon />
                        </IconButton>
                    </Tooltip>

                    {props.image && props.image !== "" &&
                        < Tooltip title="הצגת תמונה" arrow>
                            <IconButton aria-label="הצגת תמונה"
                                onClick={openImage}>
                                <ImageIcon />
                            </IconButton>
                        </Tooltip>
                    }
                </div>
            </div>
            <div className={styles.messageBody}>
                <div className={styles.messageHeader}>
                    {`${props.itemName} פורסם על ידי ${props.creatorName}`}
                </div>
                <div className={styles.messageContent}>
                    {props.itemDescription}
                </div>
            </div>
        </div >
    );
}