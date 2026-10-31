import React from 'react';
import { WebSearchResultBubble } from '../../components/WebSearchResultCard';
export class WebSearchTalentUI {
    constructor() {
        this.name = 'web_search';
    }
    renderResult(result) {
        if (result.type !== 'search') {
            return null;
        }
        return (<WebSearchResultBubble query={result.query} results={result.results}/>);
    }
}
