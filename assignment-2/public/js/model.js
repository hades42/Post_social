export { Model };
/*
 *
 * Module: Model module is responsible for handling and fetching data for the web application
 *
 * Student Name: Van Nguyen Nguyen
 * Student Number: 45515409
 *
 */

/*
 * Model class to support the FlowTow application
 * this object provides an interface to the web API and a local
 * store of data that the application can refer to.
 * The API generates different events:
 *   "modelUpdated" event when new data has been retrieved from the API
 *   "postAdded" event when a request to add a new post returns
 *   "likeAdded" event when a request to add a new like returns
 *   "commentAdded" event when a request to add a new comment returns
 */

const Model = {
  postsUrl: "/posts",
  uploadUrl: "/upload/",
  commentsUrl: "/comments",

  //this will hold the post data stored in the model
  data: {
    posts: [],
    comments: [],
  },

  // Get authenticated information of user
  getAuth(){
     const AuthData = JSON.parse(sessionStorage.getItem("UserInfo"));
     return AuthData;
  },
  // updatePosts - retrieve the latest list of posts from the server API
  // when the request is resolved, creates a "modelUpdated" event
  updatePosts: function () {
    fetch(this.postsUrl)
      .then((res) => res.json())
      .then((data) => {
        fetch(this.commentsUrl)
          .then((res) => res.json())
          .then((data) => {
            this.setComments(data);
            let event = new CustomEvent("modelUpdated");
            window.dispatchEvent(event);
          });
        this.setPosts(data);
      })
      .catch((err) => {
        console.log(err);
      });
  },

  // getPosts - return an array of post objects
  getPosts: function () {
    //before that you may need to sort the posts by their timestamp
    let newData = this.data.posts.sort(
      (a, b) => new Date(b.published_at) - new Date(a.published_at)
    );
    return newData;
  },

  // getPost - return a single post given its id
  getPost: function (postid) {
    const found = this.data.posts.find((el) => el.id === postid);
    return found;
  },

  setPosts: function (posts) {
    this.data.posts = posts;
  },

  setComments: function (comments) {
    this.data.comments = comments;
  },

  // addPost - add a new post by submitting a POST request to the server API
  // postData is an object containing all fields in the post object (e.g., p_caption)
  // when the request is resolved, creates an "postAdded" event
  addPost: function (imageData, postData) {
    fetch(this.uploadUrl, {
      method: "POST",
      headers: {
        Authorization: `bearer ${this.getAuth().jwt}`,
      },
      body: imageData,
    })
      .then((res) => res.json())
      .then((data) => {
        postData = { ...postData, p_image: data[0] };
        fetch(this.postsUrl, {
          method: "POST",
          headers: {
            Authorization: `bearer ${this.getAuth().jwt}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(postData),
        })
          .then((res) => res.json())
          .then((data) => {
            this.setPosts(data);
            let event = new CustomEvent("postAdded");
            window.dispatchEvent(event);
          });
      });
  },

  // getUserPosts - return just the posts for one user as an array
  getUserPosts: function (userid) {
    const newData = this.getPosts().filter((el) => el.p_author.id === userid);
    return newData;
  },

  // addLike - increase the number of likes by 1
  //      by submitting a PUT request to the server API
  //      postId - is the id of the post
  // when the request is resolved, creates an "likeAdded" event
  addLike: function (postId) {
    let updatedData = this.data.posts.find((el) => el.id === postId);
    updatedData.p_likes = (++updatedData.p_likes).toString();
    fetch(this.postsUrl + "/" + postId, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updatedData),
    })
      .then((res) => {
        return res.json();
      })
      .then((data) => {
        let event = new CustomEvent("likeAdded");
        window.dispatchEvent(event);
      });
  },

  // addComment - add a comment to a post
  //      by submitting a POST request to the server API
  //      commentData is an object containing the content of the comment, the author and the postid
  // when the request is resolved, creates an "commentAdded" event
  addComment: function (commentData) {
    //  const AuthData = JSON.parse(sessionStorage.getItem(UserInfo));
    fetch(this.commentsUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `bearer ${this.getAuth().jwt}`,
      },
      body: JSON.stringify(commentData),
    })
      .then((res) => res.json())
      .then((data) => {
        this.setComments(data);
        let event = new CustomEvent("commentAdded");
        window.dispatchEvent(event);
      });
  },

  // deletePost - delete a Post
  //      by submitting a DELETE request to the server API
  // when the request is resolved, creates an "deletePost" even
  deletePost: function (id) {
    fetch(this.postsUrl + "/" + id, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `bearer ${this.getAuth().jwt}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        let event = new CustomEvent("deletePost");
        window.dispatchEvent(event);
      });
  },
  //getRandomPosts - return N random posts as an array
  getRandomPosts: function (N) {
    let array = this.getPosts();
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array.slice(0,N);
  },

  // getRecentPosts - return the N most recent as an array
  //  posts, ordered by timestamp, most recent first
  getRecentPosts: function (N) {
    let newData = this.getPosts().sort(
      (a, b) => new Date(b.published_at) - new Date(a.published_at)
    );
    return newData.slice(0, N);
  },

  // getPopularPosts - return the N most popular as an array
  // posts, ordered by the number of likes
  getPopularPosts: function (N) {
    let newData = this.getPosts().sort((a, b) => b.p_likes - a.p_likes);
    return newData.slice(0, N);
  },
};
