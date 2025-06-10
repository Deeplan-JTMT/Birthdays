import * as React from 'react';
import styles from './Spotlight.module.scss';
import { SPFI } from '@pnp/sp';
import { WebPartContext } from '@microsoft/sp-webpart-base';

interface Employee {
    Title: string;
    employeeName: string;
    employeePhoto: string; // Assuming this is a string representation (URL or base64)
    eventBlessing: string;
    eventDescription: string;
    isDisplay: boolean;
    Index: number;
    ID: number;
}

interface SpotlightProps {
    sp: SPFI;
    SpotlightId: string;
    context: WebPartContext;
    SpotlightInterval: number;
}

interface SpotlightState {
    currentIndex: number;
    employeesList: Employee[];
    isLoading: boolean;
}

const defaultSpotlightState: SpotlightState = {
    currentIndex: 0,
    employeesList: [],
    isLoading: true, // Introduce a loading state
};

export default function Spotlight({ sp, SpotlightId, context, SpotlightInterval }: SpotlightProps) {
    const [state, setState] = React.useState<SpotlightState>(defaultSpotlightState);

    React.useEffect(() => {
        const fetchSpotlight = async () => {
            const items: Employee[] = await sp.web.lists.getById(SpotlightId).items
                .select('Title', 'employeeName', 'employeePhoto', 'eventBlessing', 'eventDescription', 'isDisplay', 'Index', 'ID', 'employeeEmail')
                .orderBy('Index')()
                .then(items => items.filter(item => item.isDisplay)); // Assuming you want to filter by `isDisplay`
            setState(prevState => ({
                ...prevState, employeesList: items,
                isLoading: false // Update loading state upon completion
            }));
        };

        fetchSpotlight();
    }, []);

    React.useEffect(() => {
        const interval = setInterval(() => {
            setState(prevState => ({
                ...prevState,
                currentIndex: (prevState.currentIndex + 1) % prevState.employeesList.length,
            }));
        }, SpotlightInterval);

        return () => clearInterval(interval); // Cleanup the interval on component unmount
    }, [state.isLoading, state.employeesList.length]);

    const currentEmployee = state?.employeesList[state.currentIndex];

    const onPictureConverterUrl = (imageFromSP: any, id: number): string => {
        let imageUrl

        if (imageFromSP.employeeEmail !== null && imageFromSP.employeeEmail !== "") {


            imageUrl = `https://projects1.sharepoint.com/sites/portal/_layouts/15/userphoto.aspx?size=L&username=${imageFromSP.employeeEmail}`;
            console.log(imageUrl);
        } else {
            imageUrl = require("../../assets/profilePicDemo.jpg")
        }

        return imageUrl;
    };

    return (
        <div className={styles.spotlightContainer}>
            {currentEmployee && (
                <div>
                    <div style={{ display: 'flex', justifyContent: "center" }} className={`${styles.title}`}>
                        {currentEmployee.Title}
                    </div>
                    <div className={`${styles.item}`}>
                        <div className={styles.imageContainer}>
                            <img
                                src={onPictureConverterUrl(currentEmployee, currentEmployee?.ID)}
                                alt={currentEmployee?.employeeName}
                                className={styles.peopleImg}
                            />
                        </div>
                        <div dangerouslySetInnerHTML={{ __html: currentEmployee?.eventDescription }} className={styles.eventDescription}></div>
                        <div style={{ fontWeight: 700 }}>{currentEmployee?.employeeName}</div>
                    </div>
                </div>

            )}
        </div>
    );
}
