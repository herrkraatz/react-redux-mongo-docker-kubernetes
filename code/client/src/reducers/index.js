import { combineReducers } from 'redux';
import { reducer as form } from 'redux-form';
import authReducer from './auth_reducer';

// reachable under state.form and state.auth
const rootReducer = combineReducers({
  // ES6
  form,
  // ES5
  // form: form
  auth: authReducer
});

export default rootReducer;
