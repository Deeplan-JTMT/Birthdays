import * as React from 'react';
import styles from './GTMessage.module.scss';
import { Menu, MenuItem, Tooltip } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import {
    Delete as DeleteIcon,
    Phone as PhoneIcon,
    Email as EmailIcon,
    Image as ImageIcon
} from '@mui/icons-material';
import { ISiteUserInfo } from '@pnp/sp/site-users/types';
import Swal from 'sweetalert2';
import MoreVertIcon from '@mui/icons-material/MoreVert';

interface GTMessageProps {
    creationDate: string;
    itemName: string;
    creatorName: string;
    itemId: number;
    CurrentUser: ISiteUserInfo | undefined;
    itemDescription: string;
    phoneNumber: string;
    email: string;
    Image: string | null;
    removeItem: (itemId: number) => void;
    stopTimer: () => void;
    resumeTimer: () => void;
}

export default function GTMessage(props: GTMessageProps) {
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const menuClose = () => {
        setAnchorEl(null);
    };
    function openImage() {
        Swal.fire({
            title: props.itemName,
            imageUrl: props.Image,   // can be data-URI, blob, etc.
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
                props.removeItem(props.itemId);            // ← runs ONLY on confirmation
            }
        });
    }

    return (
        <div className={styles.messageContainer}
            onMouseEnter={props.stopTimer}
            onMouseLeave={props.resumeTimer}>
            <div className={styles.upperRow}>
                <div className={styles.itemName}>
                    למסירה {props.itemName}:
                </div>
                <div className={styles.buttonsContainer}>
                    <IconButton onClick={handleMenuClick}>
                        <MoreVertIcon />
                    </IconButton>
                    <Menu
                        anchorEl={anchorEl}
                        open={open}
                        onClose={menuClose}
                    >
                        {props.CurrentUser && props.CurrentUser.Title === props.creatorName &&
                            <MenuItem onClick={() => { menuClose(); openDeleteConfirmationModal(); }}>
                                <DeleteIcon sx={{ marginRight: 1 }} />
                                הסר מוצר
                            </MenuItem>
                        }

                        <MenuItem onClick={menuClose} disabled>
                            <PhoneIcon sx={{ marginRight: 1 }} />
                            {props.phoneNumber}
                        </MenuItem>

                        <MenuItem component="a" href={`mailto:${props.email}`} onClick={menuClose}>
                            <EmailIcon sx={{ marginRight: 1 }} />
                            פנייה במייל
                        </MenuItem>

                        {props.Image && props.Image !== "" &&
                            <MenuItem onClick={() => { menuClose(); openImage(); }}>
                                <ImageIcon sx={{ marginRight: 1 }} />
                                הצגת תמונה
                            </MenuItem>
                        }
                    </Menu>
                </div>
            </div>
            <div className={styles.messageBody}>
                <div className={styles.messageContent}>
                    {props.itemDescription}
                </div>
                <div className={styles.messageHeader}>
                    {`פורסם על ידי ${props.creatorName}`}
                </div>
                <div className={styles.messageHeader}>
                    {`פורסם בתאריך ${props.creationDate}`}
                </div>

            </div>
        </div >
    );
}