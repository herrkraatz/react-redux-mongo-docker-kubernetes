import React, { Component } from 'react';
import { connect } from 'react-redux';
import * as actions from '../actions';

class Feature extends Component{

  componentWillMount(){
    this.props.fetchMessage();
  }

  render() {
    return <div>The super secret clip is: <a target='blank' href={this.props.message}>Make it so !</a></div>;
  }
}

function mapStateToProps(state){
  return { message: state.auth.message };
}

export default connect(mapStateToProps, actions)(Feature);
