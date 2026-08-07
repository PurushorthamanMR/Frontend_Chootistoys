import { Component } from 'react';
import PageBroken from '../pages/PageBroken';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Unhandled error:', error, info);
  }

  render() {
    if (this.state.hasError) return <PageBroken />;
    return this.props.children;
  }
}
