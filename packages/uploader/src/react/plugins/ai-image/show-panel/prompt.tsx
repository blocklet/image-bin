/* eslint-disable no-return-assign */
import styled from '@emotion/styled';
import { useReactive, useDebounceFn } from 'ahooks';

import Slider from '@mui/material/Slider';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';

import { useAIImageContext, AIImagePromptProps } from './context';
import { FormControlLabel, Radio, RadioGroup } from '@mui/material';

const dalle3Sizes = ['1024x1024', '1024x1792', '1792x1024'];
const dalle2Sizes = ['256x256', '512x512', '1024x1024'];

const models = [
  { label: 'DALL·E 3', value: 'dall-e-3' },
  { label: 'DALL·E 2', value: 'dall-e-2' },
];

export default function Prompt({ onSubmit }: { onSubmit: (value: AIImagePromptProps) => void }) {
  const { loading, i18n } = useAIImageContext();

  const values = useReactive<AIImagePromptProps>({
    model: 'dall-e-3',
    prompt: '',
    size: '1024x1024',
    number: 1,
  });

  const submit = () => {
    const submitValue = JSON.parse(JSON.stringify(values));

    const v: (number | string)[] = Object.values(values);
    const allValued = v.every((param) => !!param);
    if (allValued) {
      onSubmit(submitValue);
    }
  };

  const { run } = useDebounceFn(submit, { wait: 500 });

  const sliderWrapperProps = { width: '100%', pl: '12px', pr: '16px' };
  const marks = values.model === 'dall-e-2' ? dalle2Sizes : dalle3Sizes;

  return (
    <Root onSubmit={(e: any) => e.preventDefault()}>
      <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', m: 2, mb: 0 }}>
        <Grid container gap={2.5}>
          <Grid item xs={12}>
            <Typography gutterBottom className="title label">
              {i18n('aiImagePrompt')}
            </Typography>

            <TextField
              sx={{ width: 1, mt: 1 }}
              size="small"
              type="text"
              required
              placeholder={i18n('aiImagePromptTip')}
              multiline
              minRows={6}
              maxRows={6}
              value={values.prompt ?? ''}
              onChange={(e: any) => {
                e.stopPropagation();
                values.prompt = e.target.value;
              }}
              inputProps={{ maxLength: 1000 }}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography gutterBottom className="title label">
              {`${i18n('aiImageModel')}`}
            </Typography>

            <RadioGroup
              row
              sx={{ '.MuiFormControlLabel-label': { fontSize: '12px' } }}
              value={values.model}
              onChange={(e) => {
                values.size = '1024x1024';
                values.model = e.target.value as any;
              }}>
              {models.map((item) => {
                return (
                  <FormControlLabel
                    value={item.value}
                    control={<Radio size="small" />}
                    key={item.label}
                    label={item.label}
                  />
                );
              })}
            </RadioGroup>
          </Grid>

          <Grid item xs={12}>
            <Typography gutterBottom className="title label">
              {`${i18n('aiImageSize')}: ${values.size}`}
            </Typography>

            <Grid container sx={{ gap: 2.5, pt: 1 }}>
              <Box flex={1}>
                <Box {...sliderWrapperProps}>
                  <Slider
                    size="small"
                    min={0}
                    max={marks.length - 1}
                    step={1}
                    value={marks.findIndex((x) => x == values.size)}
                    onChange={(e: any, newValue) => {
                      values.size = marks[newValue as number];
                    }}
                  />
                </Box>
              </Box>
            </Grid>
          </Grid>

          <Grid item xs={12}>
            <Typography gutterBottom className="title label">
              {`${i18n('aiImageNumber')}: ${values.number}`}
            </Typography>

            <Box {...sliderWrapperProps}>
              <Slider
                size="small"
                defaultValue={1}
                valueLabelDisplay="auto"
                step={1}
                min={1}
                max={10}
                value={values.number as number}
                //@ts-ignore
                onChange={(e: any, newValue: string) => {
                  e.stopPropagation();
                  values.number = Number(newValue);
                }}
              />
            </Box>
          </Grid>
        </Grid>
      </Box>

      <Button
        sx={{ m: 2, my: 1, transition: 'all 0.3s' }}
        className={'submit-ai'}
        type="submit"
        variant="contained"
        onClick={run}
        disabled={loading}>
        {loading ? i18n('aiImageGenerating') : i18n('aiImageGenerate')}
      </Button>
    </Root>
  );
}

const Root = styled(Box)`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;

  .title {
    padding: 0 0 4px 1px;
  }

  .label {
    font-weight: 500;
    font-size: 15px;
    line-height: 100%;
    margin: 0;
    word-wrap: break-word;
    text-align: left;
  }

  .submit-ai {
    height: 40px;
    background: linear-gradient(90deg, #45e4fa 0%, #8a45fa 52.08%, #fa45bc 100%);
    border-radius: 30px;
    box-shadow: none;
    text-transform: none;

    &.Mui-disabled {
      color: rgba(0, 0, 0, 0.26);
      background: rgba(0, 0, 0, 0.12);
    }
  }

  .MuiFormHelperText-root {
    font-style: normal;
    font-weight: 500;
    font-size: 12px;
    line-height: 14px;
    color: #9397a1;
    margin: 0;
    margin-top: 4px;
  }

  .MuiOutlinedInput-root {
    background: #fbfbfb;
    border-radius: 4px;
    padding: 0;

    textarea {
      padding: 8.5px 14px;
    }

    fieldset {
      border: 1px solid #f6f6f6;
    }

    &:hover fieldset {
      border: 1px solid #a482fe;
    }
  }

  .Mui-focused {
    &.MuiFormLabel-root {
      color: #a482fe;
    }

    &.MuiOutlinedInput-root {
      fieldset {
        border: 1px solid #a482fe;
      }
    }
  }

  .Mui-error {
    &.MuiFormLabel-root {
      color: #f16e6e;
    }

    &.MuiOutlinedInput-root + .MuiFormHelperText-root {
      color: #f16e6e;
    }

    &.MuiOutlinedInput-root {
      fieldset {
        border: 1px solid #f16e6e;
      }
    }
  }
`;
