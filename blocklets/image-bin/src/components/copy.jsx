/* eslint-disable react/prop-types */
import { useState, useEffect } from 'react';
import Copy from 'copy-to-clipboard';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import styled from '@emotion/styled';

export default function ClickToCopy({ content }) {
  const [copied, setCopied] = useState(false);
  const { t } = useLocaleContext();
  const onCopy = () => {
    Copy(content);
    setCopied(true);
  };

  useEffect(() => {
    let timer = null;
    if (copied) {
      timer = setTimeout(() => {
        setCopied(false);
      }, 2000);
    }

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  });

  return (
    <Container component="span" onClick={onCopy}>
      {copied ? t('common.copied') : t('common.copyUrl')}
    </Container>
  );
}

const Container = styled.div`
  display: inline;
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow-wrap: break-word;
  align-items: center;
  justify-content: start;
  background-color: rgba(0, 0, 0, 0.08);
  cursor: pointer;
`;
