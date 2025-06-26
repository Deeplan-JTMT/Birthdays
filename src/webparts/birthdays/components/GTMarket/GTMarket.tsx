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
import createCache from '@emotion/cache';
import rtlPlugin from 'stylis-plugin-rtl';
import { prefixer } from 'stylis'
import { CacheProvider } from '@emotion/react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import MenuIcon from '@mui/icons-material/Menu';
import ArrowLeftIcon from '@mui/icons-material/ArrowLeft';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';

interface GTMarketProps {
    sp: SPFI;
    context: WebPartContext;
    gtMarketListId: string;
    GTMarketImageListId: string;
    switchPostTime: number;
}

const cacheRtl = createCache({
    key: 'muirtl',
    stylisPlugins: [prefixer, rtlPlugin],
});

const DATE_FORMAT = 'DD/MM/YYYY'

export default function GTMarket(props: GTMarketProps) {
    const [filterList, setFilterList] = React.useState<boolean>(false)
    const flipFilter = () => setFilterList(prev => !prev);
    const [gtMessages, setGtMessages] = React.useState<GTMessageType[]>([]);
    const [currentUser, serCurrentUser] = React.useState<ISiteUserInfo>();
    const [showForm, setShowForm] = React.useState<boolean>(false);
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const [page, setPage] = React.useState<number>(0);
    const open = Boolean(anchorEl);
    const timeoutRef = React.useRef<number | undefined>(undefined);


    React.useEffect(() => {
        init();
    }, [])

    // האפקט שמנהל את הטיימר
    React.useEffect(() => {
        if (gtMessages.length === 0) return;
        // בכל שינוי עמוד – מנקים טיימר ישן, מתחילים חדש
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        timeoutRef.current = setTimeout(() => {
            console.log("page: ", page);
            setPage(prev => (prev + 1) % gtMessages.length);
        }, props.switchPostTime * 1000);//switchPostTime is in seconds

        // מנקים טיימר ביציאה/שינוי עמוד
        return () => clearTimeout(timeoutRef.current);
    }, [page, gtMessages.length]);

    const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const menuClose = () => {
        setAnchorEl(null);
    };

    async function init() {
        const data = await getData();
        const messages = await getGTMessages(data);
        setGtMessages(prev => messages);
    }

    function changePage(pageNumber: number) {
        console.log("pageNumber: ", pageNumber);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setPage(pageNumber);//two posts per page with a chance to have a page with one post if there is an odd number of posts
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
                    .top(MAX_SIZE)
                    .select("Id", "itemName", "creatorName", "Description", "phoneNumber", "email", "itemImage/serverRelativeUrl")();
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
    ): Promise<GTMessageType[]> {
        try {
            const currUser: ISiteUserInfo = await props.sp.web.currentUser();
            serCurrentUser(currUser)
            console.log("rows: ", rows)
            return rows.map((item): GTMessageType => ({
                creationDate: moment(item.Created).format(DATE_FORMAT).toString(),                   // DateTime → Moment
                itemName: item.itemName || "",          // fallbacks if field differs
                creatorName: item.creatorName || "",
                itemId: item.Id,
                CurrentUser: currUser,            // or pull from item if stored there
                itemDescription: item.Description || "",
                phoneNumber: item.phoneNumber || "",
                email: item.email || "",
                Image: JSON.parse(item.itemImage)?.serverRelativeUrl || "",
                // imageId: item.imgId,
            }));
        }
        catch (err) {
            console.log("error:", err);
            return [];
        }
    }

    async function removeItem(itemId: number, imageId: number | null = null) {
        try {
            await props.sp.web.lists.getById(props.gtMarketListId).items.getById(itemId).recycle();
            setGtMessages(prev => prev.filter(message => message.itemId !== itemId))
        }
        catch (err) {
            console.error("error caught during item or image delete: ", err)
        }
    }

    function showAdditionForm() { setShowForm(true) }

    function closeAdditionForm() { setShowForm(false) }
    const pages = Math.ceil(gtMessages.length / 2);
    return (
        <CacheProvider value={cacheRtl}>
            <div className={styles.marketContainer} >
                {showForm && currentUser && <GTMarketForm CurrentUser={currentUser} creationDate={moment()} creatorName="" email="" image="" imageId={0} itemDescription=""
                    itemId={0} itemName="" open={showForm} phoneNumber="" key="GTMarketForm" closeForm={closeAdditionForm}
                    context={props.context} GTMarketListId={props.gtMarketListId} GTMarketImagesListId={props.GTMarketImageListId} />}
                <div className={styles.titleContainer}>
                    <div className={styles.title}>
                        שוק תן וקח
                    </div>
                    <div className={styles.buttonsContainer}>
                        <Tooltip title="תפריט פעולות" arrow>
                            <IconButton onClick={handleMenuClick}>
                                <MenuIcon />
                            </IconButton>
                        </Tooltip>

                        <Menu anchorEl={anchorEl} open={open} onClose={menuClose}>
                            <MenuItem onClick={() => { showAdditionForm(); menuClose(); }}>
                                <AddIcon sx={{ marginRight: 1 }} />
                                הוספה
                            </MenuItem>
                            <MenuItem onClick={() => { flipFilter(); menuClose(); }}>
                                {filterList ? (
                                    <>
                                        <FilterListOffIcon sx={{ marginRight: 1 }} />
                                        כל המוצרים
                                    </>
                                ) : (
                                    <>
                                        <FilterListIcon sx={{ marginRight: 1 }} />
                                        המוצרים שלי
                                    </>
                                )}
                            </MenuItem>
                        </Menu>
                    </div>
                </div>
                <div className={`${styles.marketBody}`} id='GTMarketBody'>
                    {(filterList
                        ? gtMessages.filter(m => m.creatorName === currentUser?.Title)   // my items
                        : gtMessages                                                    // all items
                    ).slice(page, page + 1).map((message, idx) => (
                        <GTMessage
                            key={`gtMessage${idx}`}
                            removeItem={message.Image !== "" ?
                                () => removeItem(message.itemId)
                                : () => removeItem(message.itemId)
                            }
                            {...message}
                        />
                    ))}
                </div>
                <div className={styles.paginationContainer}>
                    <Tooltip title="הבא" arrow>
                        <span>
                            <IconButton
                                onClick={() => changePage((page + 1) % gtMessages.length )}
                            >
                                <ArrowRightIcon />
                            </IconButton>
                        </span>
                    </Tooltip>
                    <Tooltip title="הקודם" arrow>
                        <span>
                            <IconButton
                                onClick={() => changePage((page - 1 + gtMessages.length) % gtMessages.length)}
                            >
                                <ArrowLeftIcon />
                            </IconButton>
                        </span>
                    </Tooltip>
                </div>
            </div>
        </CacheProvider>
    );
}
