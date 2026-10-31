import React, { useContext } from 'react';
import { Alert, TouchableOpacity, View } from 'react-native';
import { observer } from 'mobx-react';
import { Text } from 'react-native-paper';
import Clipboard from '@react-native-clipboard/clipboard';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { CopyIcon, SearchIcon } from '../../assets/icons';
import { useTheme } from '../../hooks';
import { PlayButton } from '../TextMessage/PlayButton';
import { styles } from './styles';
import { chatSessionStore } from '../../store';
import { L10nContext } from '../../utils';
import { derivedText } from '../../utils/chat';
import { finiteNumber } from '../../utils/finite';
import { t } from '../../locales';
const hapticOptions = {
    enableVibrateFallback: true,
    ignoreAndroidSystemSettings: false,
};
export const AssistantTurnFooter = observer(({ message }) => {
    const theme = useTheme();
    const l10n = useContext(L10nContext);
    const { copyable, interrupted, truncationLikely, completionResult } = message.metadata || {};
    const timings = message.metadata?.timings;
    const ragSources = message.metadata
        ?.ragSources;
    if (!timings && !copyable && !interrupted && !ragSources?.length) {
        return null;
    }
    // The sticky context-full banner is the stronger surface for the turn that
    // drives it, so that turn shows plain interrupted status instead of "cut off".
    const suppressTruncated = truncationLikely === true &&
        completionResult != null &&
        completionResult === chatSessionStore.lastCompletionResult &&
        chatSessionStore.lastCompletionResult?.contextFull === true;
    const componentStyles = styles({ theme });
    // A stored row is whatever the server said when the message was written,
    // so every value is read as unknown: a part is rendered only for a finite
    // number, and zero stays a number.
    const msPerToken = finiteNumber(timings?.predicted_per_token_ms);
    const tokensPerSec = finiteNumber(timings?.predicted_per_second);
    const promptTokensPerSec = finiteNumber(timings?.prompt_per_second);
    const cachedTokens = finiteNumber(timings?.cache_n);
    const ttft = finiteNumber(timings?.time_to_first_token_ms);
    const timingParts = [];
    if (msPerToken !== undefined) {
        timingParts.push(t(l10n.components.bubble.msPerToken, { value: msPerToken.toFixed() }));
    }
    if (tokensPerSec !== undefined) {
        timingParts.push(t(l10n.components.bubble.tokensPerSec, {
            value: tokensPerSec.toFixed(2),
        }));
    }
    // llama.rn reports both of these on local turns too, so origin gates them
    // rather than presence; the local footer is a separate decision.
    const isRemoteTurn = completionResult?.isRemote === true;
    if (isRemoteTurn && promptTokensPerSec !== undefined) {
        timingParts.push(t(l10n.components.bubble.promptTokensPerSec, {
            value: promptTokensPerSec.toFixed(2),
        }));
    }
    // Zero is included: a build that does not report prompt-cache reuse omits
    // the key entirely, while a cold prompt on a build that does reports 0.
    // Those are different facts and read differently.
    if (isRemoteTurn && cachedTokens !== undefined) {
        timingParts.push(t(l10n.components.bubble.cachedTokens, {
            value: String(cachedTokens),
        }));
    }
    if (ttft !== undefined) {
        timingParts.push(t(l10n.components.bubble.ttft, { value: ttft }));
    }
    const fullTimingsString = timingParts.join(', ');
    const draftTokens = finiteNumber(timings?.draft_tokens);
    const draftAccepted = finiteNumber(timings?.draft_tokens_accepted) ?? 0;
    const showDraft = draftTokens !== undefined && draftTokens > 0;
    const draftPct = showDraft
        ? Math.round((draftAccepted / draftTokens) * 100)
        : 0;
    const draftString = showDraft
        ? t(l10n.components.bubble.draftAccepted, {
            accepted: String(draftAccepted),
            total: String(draftTokens),
            pct: String(draftPct),
        })
        : '';
    const copyToClipboard = () => {
        if (message.type !== 'text' && message.type !== 'assistant_turn') {
            return;
        }
        ReactNativeHapticFeedback.trigger('impactLight', hapticOptions);
        Clipboard.setString(derivedText(message).trim());
    };
    const showRagSources = () => {
        if (!ragSources?.length) {
            return;
        }
        Alert.alert(l10n.components.bubble.ragSourceTitle, ragSources.map((s, i) => `${i + 1}. ${s.name}`).join('\n'), [{ text: l10n.components.bubble.ragSourceOk }]);
    };
    return (<View style={componentStyles.container} testID="assistant-turn-footer">
        <PlayButton message={message}/>
        {copyable && (<TouchableOpacity onPress={copyToClipboard} testID="footer-copy">
            <CopyIcon stroke={theme.colors.textSecondary} width={16} height={16}/>
          </TouchableOpacity>)}
        {ragSources && ragSources.length > 0 ? (<TouchableOpacity onPress={showRagSources} testID="footer-rag-sources" style={componentStyles.ragSourceChip}>
            <SearchIcon stroke={theme.colors.textSecondary} width={14} height={14}/>
            <Text style={componentStyles.ragSourceText} numberOfLines={1}>
              {l10n.components.bubble.ragSourceLabel}:{' '}
              {ragSources.map(s => s.name).join(', ')}
            </Text>
          </TouchableOpacity>) : null}
        {timings && fullTimingsString ? (<Text style={componentStyles.timing} testID="footer-timing">
            {fullTimingsString}
          </Text>) : null}
        {showDraft ? (<Text style={componentStyles.timing} testID="message-draft-tokens">
            {draftString}
          </Text>) : null}
        {interrupted ? (<Text style={componentStyles.interruptedStatus} testID="footer-interrupted-status">
            {truncationLikely && !suppressTruncated
                ? l10n.components.bubble.truncated
                : l10n.components.bubble.interrupted}
          </Text>) : null}
      </View>);
});
