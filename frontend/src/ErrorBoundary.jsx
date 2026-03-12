import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    // could log to monitoring here
    void error;
    void info;
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20 }}>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Something went wrong</div>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>{String(this.state.error ?? "Unknown error")}</div>
        </div>
      );
    }
    return this.props.children;
  }
}
