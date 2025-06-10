import * as React from 'react';
import styles from './MoviePreview.module.scss';

interface MoviePreviewProps {
    movie: any;
    onClose: () => void;
}

export default function MoviePreview({ movie, onClose }: MoviePreviewProps) {

    return (
        <div className={styles.moviePreviewModalScreen} onClick={onClose}>
            <div className={styles.moviePreviewModal} onClick={(ev) => ev.stopPropagation()}>
                <div className={styles.movieContent}>
                    <div className={styles.movieContentText}>
                        <span>{movie.Title}</span>
                        <span>{movie.Description}</span>
                    </div>

                    <div className={styles.movieAuthor}>
                        <span>{movie.Author.Title}</span>
                        <img src={`/_layouts/15/userphoto.aspx?AccountName=${movie.Author.EMail}&Size=L`} alt="" />
                    </div>
                </div>

                <img className={styles.movieImg} src={encodeURI(movie.PictureLink.Url.replace(/ /g, "%20"))} alt="" />
            </div>
        </div>
    );
}