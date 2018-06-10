import axios from 'axios';

// to get url info OR to enable programmatic url changes
import { browserHistory } from 'react-router';

import {
  AUTH_USER,
  UNAUTH_USER,
  AUTH_ERROR,
  FETCH_MESSAGE
} from './types';

// IMPORTANT:
// Comment-in what you need, comment-out what you don't need:
// LOCAL + DOCKER SETUP:
const ROOT_URL = 'http://localhost:3090';
// KUBERNETES SETUP:
// const ROOT_URL = 'http://192.168.99.100:30001';
console.log("ROOT_URL", ROOT_URL);

// ES6: { email, password } = { email: email, password: password }
export function signinUser({ email, password }) {
  return function(dispatch) {

      // Our action creator:
      // ES6 template string
      axios.post(`${ROOT_URL}/signin`, { email, password })
          .then(response => {
              console.log("so good request");
              // If request is good...
              // - Update state to indicate user is authenticated
              // redux thunk middleware in action:
              dispatch({ type: AUTH_USER });
              // - Save the JWT token
              localStorage.setItem('token', response.data.token);
              // In the browser double check:
              // localStorage.getItem('token')
              // "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI1YWIwZjA3MWNjNTMyODAzNzNhYWJkYTIiLCJpYXQiOjE1MjE1NDkxNTYyMTN9.KeWlofXFTdoOXkC3iOs2ZUl-yWenemkqN_JM7NZEQFs"
              // - redirect to the route '/feature'
              browserHistory.push('/feature');
          })
          .catch(() => {
              console.log("so bad request");
              // If request is bad...
              // - Show an error to user
              dispatch(authError('Bad Login Info'));
          });

  }
}

export function signupUser({ email, password }) {
  return function(dispatch) {
    axios.post(`${ROOT_URL}/signup`, { email, password })
      .then(response => {
        dispatch({ type: AUTH_USER });
        localStorage.setItem('token', response.data.token);
        browserHistory.push('/feature');
      })
      .catch(response => dispatch(authError(response.data.error)));
  }
}

export function authError(error){
    return {
        type: AUTH_ERROR,
        payload: error
    };
}


export function signoutUser(){
    localStorage.removeItem('token');
    return { type: UNAUTH_USER };
}

export function fetchMessage(){
    // instead of redux thunk we could also use redux promise
    return function(dispatch){
        axios.get(ROOT_URL, {
            headers: { authorization: localStorage.getItem('token') }
        })
            .then(response => {
                // test without server:
                // {"message": "https://www.youtube.com/watch?v=jQONlTY81-g"}
                // console.log(response);
                // call the reducer
                dispatch({
                    type: FETCH_MESSAGE,
                    payload: response.data.message
                })
            });

    }
}

export function fetchMessageUsingReduxPromiseInsteadOfReduxThunk(){

    const request = axios.get(ROOT_URL, {
        headers: { authorization: localStorage.getItem('token') }
    });

    return {
        type: FETCH_MESSAGE,
        payload: request
    }
}