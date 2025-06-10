import * as React from "react";
import "react-slideshow-image/dist/styles.css";
import "./FeedSlideShow.css";
import { Slide } from "react-slideshow-image";
import { ModalHeader, ModalBody, Input, Label } from "reactstrap";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
//import "bootstrap/dist/css/bootstrap.min.css";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/site-users/web";
import "@pnp/sp/files";
import "@pnp/sp/folders";
import "@pnp/sp/sputilities";
import AddBoxOutlinedIcon from "@material-ui/icons/AddBoxOutlined";
import FavoriteBorderOutlinedIcon from "@material-ui/icons/FavoriteBorderOutlined";
import FavoriteOutlinedIcon from "@material-ui/icons/FavoriteOutlined";
import ChatBubbleOutlineOutlinedIcon from "@material-ui/icons/ChatBubbleOutlineOutlined";
import CloseIcon from "@material-ui/icons/Close";
import * as moment from "moment";
import "./FeedSlideShow.css";
import styles from "./MoviesAndSeries.module.scss";
import { SPFI } from "@pnp/sp";
import { IconButton, TextField, Typography } from "@material-ui/core";
import { Button } from "@mui/material";
import { DvrOutlined } from "@material-ui/icons";
import MoviePreview from "../MoviePreview/MoviePreview.cmp";
moment.locale("he");

export interface MoviesAndSeriesProps {
  sp: SPFI;
  context: any;
  MoviesAndSeriesId: string;
}

export interface MoviesAndSeriesState {
  Feed: Array<any> | null;
  isCommentsModalOpen: boolean;
  isAutoplay: boolean;
  NewCommentText: string;
  CurrPostId: number | null;
  CurrPostLiked: boolean;
  CurrPostTitle: string;
  CurrUserId: number | null;
  CurrUserTitle: string | null;
  IsNewPostPopOverOpen: boolean;
  ShareToEmail: string;
  ShareToDisplayName: string;
  CurrPostIndex: number | null;
  CurrPostComments: any | null;

  // post image files
  MoreDataFiles: Array<any>;
  MoreDataFilesProps: Array<any>;

  NewPostTitle: string;
  CloseScreenOpen: boolean;
  IsPostAdded: boolean | null;
  IsCommentAdded: boolean | null;
  imgSrc: any;

  PostComments: Array<any>;

  // movie display
  CurrMovieDisplay: any;
}

export default class MoviesAndSeries extends React.Component<
  MoviesAndSeriesProps,
  MoviesAndSeriesState
> {
  constructor(props: MoviesAndSeriesProps) {
    super(props);

    this.state = {
      Feed: null,
      isAutoplay: true,
      isCommentsModalOpen: false,
      CurrPostId: null,
      CurrPostComments: [],
      CurrUserId: null,
      CurrUserTitle: "",
      CurrPostIndex: null,
      NewCommentText: "",
      CurrPostLiked: false,
      IsNewPostPopOverOpen: false,
      PostComments: [],
      MoreDataFiles: [],
      MoreDataFilesProps: [],
      imgSrc: null,
      NewPostTitle: "",
      CurrPostTitle: "",
      CloseScreenOpen: false,
      IsPostAdded: null,
      IsCommentAdded: null,
      ShareToEmail: "",
      ShareToDisplayName: "",
      CurrMovieDisplay: null
    };
  }

  componentDidMount(): void {
    this.LoadFeed().then(() => {
      const CurrPost = this.state.Feed && this.state.Feed[0];
      const CurrPostComments = this.state.PostComments?.filter(
        (c) => c?.PostId === CurrPost.ID
      );

      this.setState({
        CurrPostId: CurrPost.ID,
        CurrPostComments: CurrPostComments,
        CurrPostTitle: CurrPost.Title,
      });
    });

    // Reload posts every minute.
    setInterval(async () => {
      const { isCommentsModalOpen, IsNewPostPopOverOpen } = this.state;

      if (!isCommentsModalOpen && !IsNewPostPopOverOpen) {
        this.LoadFeed();
      }
    }, 5000);
  }

  LoadFeed = async () => {
    try {
      let User = await this.props.sp.web.currentUser();

      const FeedResult: any[] = await this.props.sp.web.lists
        .getById("9b5aedb0-7d04-4bff-ba29-85be1b2a1616")
        .items.select(
          "ID,Title,Created,Description,PictureLink,UsersLikedId,LikesNumber,Author/Id,Author/Title,Author/Name,Author/EMail'"
        )
        .expand("Author")
        .top(5)
        .orderBy("Created", false)();

      const Feed = FeedResult.map((p) => {
        const PictureUrl = p.PictureLink ? p.PictureLink.Url : "";

        const UsersLikedId = p?.UsersLikedId ? p?.UsersLikedId : [];

        const Post = { ...p, PictureUrl, UsersLikedId };
        delete Post["Picture"];
        return Post;
      });

      const IsLiked = Feed[0]?.UsersLikedId.some((Id: any) => Id === User?.Id);

      // Get current post comments.
      const PostCommentsRes: any[] = await this.props.sp.web.lists
        .getById("e30e3eed-0742-48e3-a63a-e3eb604cb8ee")
        .items.select(
          "ID,PostId,Created,Comment,Author/Id,Author/Title,Author/Name,Author/EMail'"
        )
        .expand("Author")
        .orderBy("Created", false)();

      const PostComments = PostCommentsRes.map((p) => ({
        Id: p?.Id,
        Created: new Date(p.Created),
        PostId: p.PostId,
        Comment: p.Comment,
        AuthorDisplayName: p.Author.Title,
        AuthorEmail: p.Author.EMail,
      }));

      this.setState(
        {
          Feed,
          CurrPostIndex: 0,
          CurrPostId: Feed[0]?.ID,
          CurrPostTitle: Feed[0]?.Title,
          CurrUserId: User.Id,
          CurrUserTitle: User.Title,
          CurrPostLiked: IsLiked,
          PostComments,
        },
        () => {
          //console.log('FEED LOADED. ', this.state.PostComments);
        }
      );

      return "Fetched all posts";
    } catch (error) {
      console.log("error:", error);
    }
  };

  SetShareEmail = (items: any[]) => {
    this.setState({
      ShareToEmail: items.length ? items[0].secondaryText : "",
      ShareToDisplayName: items.length ? items[0].text : "",
    });
  };

  HandleKeyPress = (target: any) => {
    if (target.charCode == 13) {
      this.AddComment();
    }
  };

  toggleModal = () => {
    this.setState((prevState) => ({
      IsNewPostPopOverOpen: !prevState.IsNewPostPopOverOpen,
    }));
  };

  UpdatePost = async (UpdatedPost: any) => {
    try {
      const Updated = await this.props.sp.web.lists
        .getById("9b5aedb0-7d04-4bff-ba29-85be1b2a1616")
        .items.getById(Number(this.state.CurrPostId))
        .update(UpdatedPost);
      //console.log('Updated:', Updated)

      return "Post Updated";
    } catch (error) {
      console.log("error:", error);
    }
  };

  onChange = (e: { target: { name: any; value: any; checked: any } }) => {
    this.setState({
      ...this.state,
      [e.target.name]: e.target.value,
    });
  };

  ReplacePost = (UpdatedPost: any) => {
    let UpdatedItems = this.state.Feed;
    let ChangedItemObject = [];
    if (UpdatedItems) {
      for (var i = 0; i < UpdatedItems.length; i++) {
        if (UpdatedPost.Id === UpdatedItems[i].Id) {
          ChangedItemObject.push(UpdatedItems[i]);
          UpdatedItems[i] = UpdatedPost;
          break;
        }
      }
    }

    this.setState({
      ...this.state,
      Feed: UpdatedItems,
    });
  };

  LikePost = async () => {
    try {
      const { Feed, CurrPostIndex, CurrUserId } = this.state;

      const index: any = CurrPostIndex;
      const Post: any = Feed;

      const UsersLiked = Post[index]?.UsersLikedId || [];

      const UsersLikedId = [...UsersLiked, CurrUserId];
      const LikesNumber = UsersLikedId.length;

      const PostToSave = {
        UsersLikedId,
        LikesNumber,
      };

      const PostLiked = await this.UpdatePost(PostToSave);

      const UpdatedPost = {
        ...Post[index],
        UsersLikedId,
        LikesNumber,
      };

      this.setState(
        {
          CurrPostLiked: true,
        },
        () => this.ReplacePost(UpdatedPost)
      );
    } catch (error) {
      console.log("error:", error);
    }
  };

  UnlikePost = async () => {
    try {
      const { Feed, CurrPostIndex, CurrUserId } = this.state;

      const index: any = CurrPostIndex;
      const Post: any = Feed;
      const UsersLikedId = Post[index].UsersLikedId.filter(
        (Id: any) => Id !== CurrUserId
      );
      const LikesNumber = UsersLikedId.length;

      const PostToSave = {
        UsersLikedId,
        LikesNumber,
      };

      const PostUnliked = await this.UpdatePost(PostToSave);

      const UpdatedPost = {
        ...Post[index],
        UsersLikedId,
        LikesNumber,
      };

      this.setState(
        {
          CurrPostLiked: false,
        },
        () => this.ReplacePost(UpdatedPost)
      );
    } catch (error) {
      console.log("error:", error);
    }
  };

  ToggleCommentsModal = () => {
    this.setState((prevState) => ({
      isCommentsModalOpen: !prevState.isCommentsModalOpen,
      isAutoplay: prevState.isCommentsModalOpen,
    }));
  };

  ToggleFeedModal = () => {
    this.setState({
      IsNewPostPopOverOpen: !this.state.IsNewPostPopOverOpen,
      CloseScreenOpen: true,
    });
  };

  handleUploadFile = (e: any) => {
    const Allfiles = e.target.files;
    let FilesProperties = [];
    let Files = [];
    let IDCounter = this.state.MoreDataFilesProps.length;

    // If there are any files
    if (Allfiles && Allfiles.length > 0) {
      // Create Files Properties Array
      //   one file only
      for (let i = 0; 1 > i; i++) {
        FilesProperties.push({
          ID: IDCounter.toString(),
          FileName: Allfiles[i].name,
          FileType: Allfiles[i].type,
        });
        Files.push(Allfiles[i]);
        IDCounter++;
      }
      // create url
      var reader = new FileReader();
      var url = reader.readAsDataURL(Files[0]);
      reader.onloadend = function () {
        this.setState(
          {
            imgSrc: [reader.result],
          }
        );
      }.bind(this);

      // TODO: concat files
      this.setState({
        MoreDataFiles: [...Files],
        MoreDataFilesProps: [...FilesProperties],
        // FileNameError: false,
      });

      e.target.value = null;
    }
  };

  AddPost = async () => {
    try {
      const { MoreDataFiles, NewPostTitle } = this.state;

      // Validation
      if (NewPostTitle === "") {
        this.setState(
          {
            IsPostAdded: false,
            MoreDataFiles: [],
            MoreDataFilesProps: [],
            NewPostTitle: "",
            imgSrc: "",
          },
          () => {
            setTimeout(() => {
              this.setState(
                {
                  IsPostAdded: false,
                },
                this.CloseModal
              );
            }, 3000);
          }
        );
      } else {
        // Check if there is a file to upload
        let pictureLink = null;

        if (this.state.MoreDataFiles && this.state.MoreDataFiles.length > 0) {
          const file: File = this.state.MoreDataFiles[0];
          const fileName = encodeURI(file.name);

          const UploadedFile = await this.props.sp.web
            .getFolderByServerRelativePath(
              "/sites/DeeplanPortal/MoviesAndSeriesPostPictures"
            )
            .files.addUsingPath(fileName, file, { Overwrite: true });

          pictureLink = {
            Url: UploadedFile.data.ServerRelativeUrl,
            Description: UploadedFile.data.ServerRelativeUrl, // Corrected description
          };
        }

        // Create the item, include PictureLink only if it exists
        const itemData = {
          Title: this.state.NewPostTitle,
          Description: this.state.NewPostTitle,
          PictureLink: pictureLink, // Make sure to include pictureLink here
        };

        await this.props.sp.web.lists
          .getById(this.props.MoviesAndSeriesId)
          .items.add(itemData);

        // Reload posts.
        this.setState((prevState: any) => prevState + 1)

        // Upload success
        this.setState(
          {
            IsPostAdded: true,
            MoreDataFiles: [],
            MoreDataFilesProps: [],
            NewPostTitle: "",
            imgSrc: "",
          },
          () => {
            setTimeout(() => {
              this.setState(
                {
                  IsPostAdded: false,
                },
                this.CloseModal
              );
            }, 3000);
          }
        );
      }
      this.setState((prevState: any) => prevState + 1)

    } catch (error) {
      console.log("error:", error);

      // Uploaded failed
      this.setState(
        {
          IsPostAdded: false,
          MoreDataFiles: [],
          MoreDataFilesProps: [],
          NewPostTitle: "",
          imgSrc: "",
        },
        () => {
          setTimeout(() => {
            this.setState(
              {
                IsPostAdded: false,
              },
              this.CloseModal
            );
          }, 30000);
        }
      );
    }
  };

  AddComment = async () => {
    try {
      const { CurrPostTitle, NewCommentText, CurrPostId } = this.state;

      const NewComment = {
        Title: CurrPostTitle,
        Comment: NewCommentText,
        PostId: CurrPostId,
      };

      // Validation
      if (NewCommentText.trim() === "") {
        this.setState({
          NewCommentText: "",
          IsCommentAdded: false,
        });
        setTimeout(() => {
          this.setState({
            IsCommentAdded: false,
          });
        }, 3000);
        return;
      }

      // Success: Add the comment to SharePoint
      const CommentAdded = await this.props.sp.web.lists
        .getById("e30e3eed-0742-48e3-a63a-e3eb604cb8ee")
        .items.add(NewComment);

      // Get updated comments for the current post.
      const PostCommentsRes = await this.props.sp.web.lists
        .getById("e30e3eed-0742-48e3-a63a-e3eb604cb8ee")
        .items.select(
          "ID,PostId,Created,Comment,Author/Id,Author/Title,Author/Name,Author/EMail"
        )
        .expand("Author")
        .orderBy("Created", false)();

      // Map the new comments format.
      const NewPostComments = PostCommentsRes.map((p) => ({
        Id: p.ID,
        Created: new Date(p.Created),
        PostId: p.PostId,
        Comment: p.Comment,
        AuthorDisplayName: p.Author.Title,
        AuthorEmail: p.Author.EMail,
      }));

      // Filter the comments for the current post and update state.
      const FilteredComments = NewPostComments.filter(
        (comment) => comment.PostId === CurrPostId
      );
      await this.LoadFeed();
      this.setState({
        PostComments: NewPostComments,
        CurrPostComments: FilteredComments, // Update CurrPostComments
        NewCommentText: "",
        IsCommentAdded: true,
      });
    } catch (error) {
      console.log("Error adding comment:", error);
      this.setState({
        NewCommentText: "",
        IsCommentAdded: false,
      });
      setTimeout(() => {
        this.setState({
          IsCommentAdded: false,
        });
      }, 300000);
    }
  };

  // Triger system default File picker
  TriggerUploadFiles = (e: any) => {
    e.preventDefault();
    const fileInput = document.getElementById("MoreDataFiles1");
    if (fileInput) {
      fileInput.click();
    }
  };

  RemoveFile = (ID: string) => {
    let FilesProperties = [...this.state.MoreDataFilesProps];
    let Files = [...this.state.MoreDataFiles];

    FilesProperties.splice(parseInt(ID), 1);
    Files.splice(parseInt(ID), 1);

    // Sort IDs
    for (let i = 0; FilesProperties.length > i; i++) {
      FilesProperties[i].ID = i;
    }

    this.setState({
      MoreDataFiles: [...Files],
      MoreDataFilesProps: [...FilesProperties],
      //   FileNameError: false,
    });
  };

  CloseModal = (ev?: any): void => {
    if (ev) ev.stopPropagation();
    this.setState({
      CloseScreenOpen: false,
      IsNewPostPopOverOpen: false,
    });
  };

  ReplaceHexadecimals = (str: any) => {
    if (str) {
      return str.replace(/ /g, "%20");
    }
    return "";
  };

  handleMovieClick = (ev: React.MouseEvent<HTMLDivElement, MouseEvent>, CurrMovieDisplay: any) => {
    ev.stopPropagation();
    console.log('CurrMovieDisplay:', CurrMovieDisplay)
    this.setState({ CurrMovieDisplay })
  };

  public render(): React.ReactElement<MoviesAndSeriesProps> {
    const {
      Feed,
      PostComments,
      CurrPostTitle,
      IsCommentAdded,
      CurrPostComments,
    } = this.state;

    const properties = {
      duration: 5000,
      transitionDuration: 500,
      autoplay: this.state.isAutoplay,
      onChange: (_: any, newIndex: any) => {
        const CurrPost = this.state.Feed && this.state.Feed[newIndex];
        const CurrPostComments = PostComments?.filter(
          (c) => c?.PostId === CurrPost.ID
        );

        const IsLiked = CurrPost.UsersLikedId.some(
          (Id: any) => Id === this.state.CurrUserId
        );

        this.setState({
          CurrPostId: CurrPost.ID,
          CurrPostIndex: newIndex,
          CurrPostLiked: IsLiked,
          CurrPostTitle: CurrPost.Title,
          CurrPostComments: CurrPostComments,
        });
      },
    };

    const getIsPostLikedByCurrUser = (post: any): boolean => {
      return (
        Array.isArray(post?.UsersLikedId) &&
        post.UsersLikedId.some((Id: any) => Id === this.state.CurrUserId)
      );
    };

    const getPostCommentsLength = (post: any): number => {
      return (
        CurrPostComments?.filter((c: any) => c?.PostId === post.Id)?.length || 0
      );
    };

    const modalStyle = {
      position: "absolute" as "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      width: 400,
      height: "auto",
      bgcolor: "background.paper",
      boxShadow: 24,
      p: 4,
      borderRadius: "8px",
    };

    return (
      <section className={styles.Feed}>
        {this.state.CloseScreenOpen}
        {Feed && Feed.length ? (
          <div className="feed-slide-container">
            <Slide {...properties}>

              {Feed.map((p: any) => (
                <div key={p.Id} className="feed-each-slide">
                  <div className="feed-creator-wrapper">
                    <img
                      src={`/_layouts/15/userphoto.aspx?AccountName=${p.Author.EMail}&Size=L`}
                      className={styles.UserPicture}
                    />
                    <p className={styles.UserDisplayName}>{p.Author.Title}</p>
                  </div>

                  <div
                    onClick={(ev) => this.handleMovieClick(ev, p)}
                    className="feed-picture"
                    style={{
                      backgroundImage: `url(${this.ReplaceHexadecimals(
                        encodeURI(p.PictureUrl)
                      )})`,
                    }}
                  ></div>

                  <div className={styles.ActionButtons}>
                    <AddBoxOutlinedIcon
                      titleAccess="פוסט חדש"
                      fontSize="large"
                      style={{
                        cursor: "pointer",
                        fontSize: "24px",
                      }}
                      id="UncontrolledPopover"
                      onClick={this.ToggleFeedModal}
                    />

                    {getIsPostLikedByCurrUser(p) ? (
                      <FavoriteOutlinedIcon
                        titleAccess="הורדת לייק"
                        style={{
                          color: "#D7443E",
                          cursor: "pointer",
                          fontSize: "24px",
                        }}
                        fontSize="large"
                        onClick={this.UnlikePost}
                      />
                    ) : (
                      <FavoriteBorderOutlinedIcon
                        titleAccess="אהבתי"
                        fontSize="large"
                        style={{
                          cursor: "pointer",
                          fontSize: "24px",
                        }}
                        onClick={this.LikePost}
                      />
                    )}

                    <ChatBubbleOutlineOutlinedIcon
                      titleAccess="תגובות"
                      fontSize="large"
                      style={{
                        cursor: "pointer",
                        fontSize: "24px",
                      }}
                      onClick={this.ToggleCommentsModal}
                    />

                    <div className="feed-slide-likes">
                      <p>{p.UsersLikedId.length}</p>
                      <p>לייקים</p>
                    </div>
                  </div>
                </div>
              ))}
            </Slide>
          </div>
        ) : (
          <div></div>
        )}

        {/* Movie Modal */}
        {this.state.CurrMovieDisplay && <MoviePreview
          movie={this.state.CurrMovieDisplay}
          onClose={() => this.setState({ CurrMovieDisplay: null })}
        />}

        {/* Comments Modal */}
        <Modal
          open={this.state.isCommentsModalOpen}
          onClose={this.ToggleCommentsModal}
          aria-labelledby="comments-modal-title"
          aria-describedby="comments-modal-description"
          disableRestoreFocus={true}
        >
          <Box className={styles.FeedModal} sx={modalStyle}>
            <div className={styles.ModalHeader}>
              <Typography variant="h6" id="comments-modal-title">
                {CurrPostTitle}
              </Typography>
            </div>
            <div className={styles.ModalBody}>
              {this.state.CurrPostComments?.length ? (
                <div className={styles.CommentsContainer}>
                  {this.state.CurrPostComments.map((p: any, index: any) => (
                    <div key={index} className={styles.CommentWrapper}>
                      <div className={styles.UserPosted}>
                        <img
                          src={`/_layouts/15/userphoto.aspx?AccountName=${p.AuthorEmail}&Size=L`}
                          className={styles.CommentUserPicture}
                          alt={`${p.AuthorDisplayName}'s profile`}
                        />
                      </div>
                      <div className={styles.PostComment}>
                        <Typography className={styles.CommentUserDisplayName}>
                          {p.AuthorDisplayName}
                        </Typography>
                        <Typography className={styles.CommentText}>
                          {p.Comment}
                        </Typography>
                        <Typography className={styles.CommentTime}>
                          {moment(p.Created).fromNow()}
                        </Typography>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Typography variant="h6">אין תגובות בפוסט זה</Typography>
              )}
            </div>
            <div className={styles.InputComment}>
              {IsCommentAdded === null && (
                <TextField
                  onChange={(ev) =>
                    this.setState({ NewCommentText: ev.target.value })
                  }
                  value={this.state.NewCommentText}
                  onKeyPress={this.HandleKeyPress}
                  className={styles.CommentInput}
                  type="text"
                  name="PostComment"
                  id="PostComment"
                  placeholder="תגובה"
                  fullWidth
                  variant="outlined"
                />
              )}
              {IsCommentAdded === true && (
                <Typography className={styles.CommentSuccess}>
                  התגובה נוספה בהצלחה
                </Typography>
              )}
              {IsCommentAdded === false && (
                <Typography className={styles.CommentFailure}>
                  תגובה לא נשלחה, נסה שנית!
                </Typography>
              )}
            </div>
          </Box>
        </Modal>

        {/* Post Modal */}
        <Modal
          open={this.state.IsNewPostPopOverOpen}
          onClose={this.toggleModal}
          aria-labelledby="new-post-modal-title"
          aria-describedby="new-post-modal-description"
          disableRestoreFocus={true}
        >
          <Box
            className={styles.modalBody}
            sx={{ ...modalStyle, width: "400px" }}
          >
            {this.state.IsPostAdded === null && (
              <div className={styles.SharePostContainer}>
                <Typography variant="h5" className={styles.SharePostTitle}>
                  הוספת המלצה
                </Typography>
                <div className={styles.UploadImageContainer}>
                  {this.state.imgSrc !== null ? (
                    <img src={this.state.imgSrc} width="100" />
                  ) : (
                    <div
                      onClick={this.TriggerUploadFiles}
                      className={styles.UploadImage}
                    ></div>
                  )}
                  <div className={styles.ImageInputsContainer}>
                    <input
                      type="file"
                      accept="image/*,.png,.jpg,.jpeg,"
                      name="MoreDataFiles1"
                      id="MoreDataFiles1"
                      onChange={this.handleUploadFile}
                      style={{ display: "none" }}
                    />
                    <Button
                      variant="contained"
                      component="label"
                      className={styles.UploadImageLabel}
                    >
                      העלאת תמונה
                      <input
                        type="file"
                        accept="image/*,.png,.jpg,.jpeg,"
                        name="MoreDataFiles1"
                        id="MoreDataFiles1"
                        onChange={this.handleUploadFile}
                        hidden
                      />
                    </Button>
                  </div>
                </div>
                <div className={styles.PostTitleContainer}>
                  <TextField
                    type="text"
                    value={this.state.NewPostTitle}
                    autoFocus
                    placeholder={`כתוב פוסט כאן`}
                    onChange={(ev) =>
                      this.setState({ NewPostTitle: ev.target.value })
                    }
                    onKeyDown={(ev) =>
                      ev.key === "Enter" ? this.AddPost() : null
                    }
                    fullWidth
                    variant="outlined"
                  />
                  <img
                    src={require("../../assets/birthdayModalArrow.png")}
                    alt=""
                    onClick={() => this.AddPost()}
                  />
                </div>
              </div>
            )}

            {this.state.IsPostAdded === true && (
              <div style={{ height: 200 }}>

                <div className={styles.emailSend}>
                  <img
                    className={styles.emailImg}
                    src={require("../../assets/EmailSentV.png")}
                    alt=""
                  />
                  <Typography className={styles.emailMsg}>
                    הפוסט נוסף בהצלחה
                  </Typography>
                </div>
              </div>
            )}
            {this.state.IsPostAdded === false && (
              <div className={styles.emailSend}>
                <div style={{ height: 200 }}>

                  <Typography style={{ display: "flex", justifyContent: "center" }} className={styles.redX}>X</Typography>
                  <Typography className={styles.emailMsg}>
                    העלאת הפוסט נכשלה, אנא ודא שהשדות אינם ריקים
                  </Typography>
                </div>
              </div>
            )}
          </Box>
        </Modal>
      </section>
    );
  }
}
