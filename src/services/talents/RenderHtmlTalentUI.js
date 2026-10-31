import React from 'react';
import { Text, View } from 'react-native';
import { HtmlPreviewBubble } from '../../components/HtmlPreviewBubble';
import { styles as pendingStyles } from '../../components/TalentSurface/styles';
export class RenderHtmlTalentUI {
    constructor() {
        this.name = 'render_html';
    }
    renderResult(result) {
        if (result.type !== 'html' || !result.html) {
            return null;
        }
        return <HtmlPreviewBubble html={result.html} title={result.title}/>;
    }
    renderPending() {
        return (<View testID="talent-call-pending" style={pendingStyles.pendingContainer}>
        <Text style={pendingStyles.pendingText}>Generating preview…</Text>
      </View>);
    }
}
