import * as React from 'react';
import styles from './GTMarket.module.scss';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/Add';
import FilterListIcon from '@mui/icons-material/FilterList';
import FilterListOffIcon from '@mui/icons-material/FilterListOff';
import { WebPartContext } from '@microsoft/sp-webpart-base';
import { SPFI } from '@pnp/sp';
import GTMessage from './GTMessage/GTMessage';
import { GTMessageType } from '../Models/Types';
import getSP from '../../../PnPjsConfig';
import * as moment from 'moment';
import { ISiteUserInfo } from '@pnp/sp/site-users/types';
import GTMarketForm from './GTMarketForm/GTMarketForm';

interface GTMarketProps {
    sp: SPFI;
    context: WebPartContext;
    gtMarketListId: string;
    GTMarketImageListId: string;
}

const DATE_FORMAT = 'DD/MM/YYYY'

export default function GTMarket(props: GTMarketProps) {
    const [filterList, setFilterList] = React.useState<boolean>(false)
    const flipFilter = () => setFilterList(prev => !prev);
    const [gtMessages, setGtMessages] = React.useState<GTMessageType[]>([]);
    const [currentUser, serCurrentUser] = React.useState<ISiteUserInfo>();
    const [overFlow, setOverFlow] = React.useState<boolean>(true);
    const [showForm, setShowForm] = React.useState<boolean>(false);
    React.useEffect(() => {
        init();
    }, [])

    async function init() {
        const urlMap = await getImages();
        const data = await getData();
        const messages = await getGTMessages(data, urlMap);
        setGtMessages(prev => messages);
    }

    async function getData() {
        let data: any[] = [];
        let rowsidx = 0;
        const MAX_SIZE = 5000
        let rowCount = 1;//initializing with more than 0
        while (rowCount > 0) {
            try {
                let rows = await props.sp.web.lists
                    .getById(props.gtMarketListId)
                    .items
                    .skip(rowsidx * MAX_SIZE)
                    .top(MAX_SIZE)();
                rowCount = rows.length;
                rowsidx++;
                rows.forEach(row => data.push(row))
            }
            catch (err) {
                console.log("error: ", err);
                break;
            }
        }
        return data;
    }

    async function getGTMessages(
        rows: any[],
        urlMap: Map<number, string>
    ): Promise<GTMessageType[]> {
        try {
            const currUser: ISiteUserInfo = await props.sp.web.currentUser();
            serCurrentUser(currUser)
            return rows.map((item): GTMessageType => ({
                creationDate: moment(item.Created).format(DATE_FORMAT).toString(),                   // DateTime → Moment
                itemName: item.itemName || "",          // fallbacks if field differs
                creatorName: item.creatorName || "",
                itemId: item.Id,
                CurrentUser: currUser,            // or pull from item if stored there
                itemDescription: item.Description || "",
                phoneNumber: item.phoneNumber || "",
                email: item.email || "",
                image: urlMap.get(item.imgId) || "",
                imageId: item.imgId,
            }));
        }
        catch (err) {
            console.log("error:", err);
            return [];
        }
    }

    async function getImages() {
        const urlMap: Map<number, string> = new Map();
        let rowsidx = 0;
        const MAX_SIZE = 5000
        let rowCount = 1;//initializing with more than 0
        while (rowCount > 0) {
            try {
                let rows = await props.sp.web.lists
                    .getById(props.GTMarketImageListId)
                    .items
                    .select('Id', 'FileRef')
                    .skip(rowsidx * MAX_SIZE)
                    .top(MAX_SIZE)();
                rowCount = rows.length;
                rowsidx++;
                rows.forEach(row => urlMap.set(row.Id, row.FileRef))
            }
            catch (err) {
                console.log("error: ", err);
                break;
            }
        }
        return urlMap;
    }

    async function removeItem(itemId: number, imageId: number | null = null) {
        try {
            await props.sp.web.lists.getById(props.gtMarketListId).items.getById(itemId).delete();
            if (imageId) await props.sp.web.lists.getById(props.GTMarketImageListId).items.getById(imageId).delete();
            setGtMessages(prev => prev.filter(message => message.itemId !== itemId))
        }
        catch (err) {
            console.error("error caught during item or image delete: ", err)
        }
    }

    function updateOverFlow() {
        const element = document.querySelector('#GTMarketBody');  // returns the element or null
        if (overFlow) {
            element?.classList.remove(styles.overFlowAuto);
            element?.classList.add(styles.overFlowHidden)
        }
        else {
            element?.classList.add(styles.overFlowAuto);
            element?.classList.remove(styles.overFlowHidden)
        }
        setOverFlow(!overFlow);
    }

    function showAdditionForm() { setShowForm(true) }

    function closeAdditionForm() { setShowForm(false) }

    return (
        <div className={styles.marketContainer} >
            {showForm && currentUser && <GTMarketForm CurrentUser={currentUser} creationDate={moment()} creatorName="" email="" image="" imageId={0} itemDescription=""
                itemId={0} itemName="" open={showForm} phoneNumber="" key="GTMarketForm" closeForm={closeAdditionForm} />}
            <div className={styles.titleContainer}>
                <div className={styles.title}>
                    שוק תן וקח
                </div>
                <div className={styles.buttonsContainer}>
                    <Tooltip title="הוספה" arrow onClick={showAdditionForm}>
                        <IconButton aria-label="הוספה">
                            <AddIcon />
                        </IconButton>
                    </Tooltip>
                    {filterList ?
                        <Tooltip title="כל המוצרים" arrow>
                            <IconButton aria-label="כל המוצרים"
                                onClick={flipFilter}
                            >
                                <FilterListOffIcon />
                            </IconButton>
                        </Tooltip>
                        :
                        <Tooltip title="המוצרים שלי" arrow>
                            <IconButton aria-label="המוצרים שלי"
                                onClick={flipFilter}
                            >
                                <FilterListIcon />
                            </IconButton>
                        </Tooltip>
                    }
                </div>
            </div>
            <div className={`${styles.marketBody} ${styles.overFlowAuto}`} id='GTMarketBody'>
                {(filterList
                    ? gtMessages.filter(m => m.creatorName === currentUser?.Title)   // my items
                    : gtMessages                                                    // all items
                ).map((message, idx) => (
                    <GTMessage
                        key={`gtMessage${idx}`}
                        removeItem={message.imageId ?
                            () => removeItem(message.itemId, message.imageId)
                            : () => removeItem(message.itemId)
                        }
                        updateOverFlow={updateOverFlow}
                        {...message}
                    />
                ))}
            </div>
        </div>
    );
}
