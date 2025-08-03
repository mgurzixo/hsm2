"use strict";

import * as U from "src/lib/utils";
import { hsm } from "src/classes/Chsm";
import Color from "colorjs.io";

export function stateStyles(baseColor) {
  // Background
  let bg = new Color(baseColor);
  const t = hsm.settings.styles.state;
  bg.lch.c = t.bg.chroma;
  bg.lch.l = t.bg.light;
  // Title backgrounds
  const titleBgs = [new Color(baseColor), new Color(baseColor)];
  [titleBgs[0].lch.l, titleBgs[1].lch.l] = [t.titleBg.lights[0], t.titleBg.lights[1]];
  [titleBgs[0].lch.c, titleBgs[1].lch.c] = [t.titleBg.chroma, t.titleBg.chroma];
  // Border
  const border = new Color(baseColor);
  border.lch.c = t.border.chroma;
  border.lch.l = t.border.light;
  // Title text
  let titleText = new Color(baseColor);
  titleText.lch.c = t.titleText.chroma;
  titleText.lch.l = t.titleText.light;
  // TitleLine
  const titleLine = new Color(baseColor);
  titleLine.lch.c = t.titleLine.chroma;
  titleLine.lch.l = t.titleLine.light;
  return {
    border: border.to("srgb") + "",
    borderWidth: t.border.lineWidth,
    borderSelectedWidth: t.borderSelected.lineWidth,
    borderError: t.borderError.color,
    borderErrorWidth: t.borderError.lineWidth,
    titleLine: titleLine.to("srgb") + "",
    titleLineWidth: t.titleLine.lineWidth,
    bg: bg.to("srgb") + "",
    titleBgs: [titleBgs[0].to("srgb") + "", titleBgs[1].to("srgb") + ""],
    titleText: titleText.to("srgb") + "",
    titleTextFont: t.titleText.font,
    titleTextSizePc: t.titleText.sizePc,
  };
}

export function trStyles(baseColor) {
  const t = hsm.settings.styles.tr;
  // Line
  const line = new Color(baseColor);
  line.lch.c = t.line.chroma;
  line.lch.l = t.line.light;
  const colLine = line.to("srgb") + "";
  line.lch.c = t.tag.chroma;
  line.lch.l = t.tag.light;
  const colTag = line.to("srgb") + "";

  return {
    line: colLine,
    tag: colTag,
    lineWidth: t.line.lineWidth,
    lineSelectedWidth: t.lineSelected.lineWidth,
    lineError: t.lineError.color,
    lineErrorWidth: t.lineError.lineWidth,
  };
}


export function noteStyles(baseColor) {
  const t = hsm.settings.styles.note;
  return {
    bg: t.bg.color,
    borderColor: t.border.color,
    borderWidth: t.border.lineWidth,
    borderSelectedColor: t.borderSelected.color,
    borderSelectedWidth: t.borderSelected.lineWidth,
    textColor: t.text.color,
    textFont: t.text.font,
    cornerP: hsm.settings.noteCornerP
  };
}

export function textStyles(baseColor) {
  const t = hsm.settings.styles.text;
  return {
    bg: t.bg.color,
    borderColor: t.border.color,
    borderWidth: t.border.lineWidth,
    borderSelectedColor: t.borderSelected.color,
    borderSelectedWidth: t.borderSelected.lineWidth,
    textColor: t.text.color,
    textFont: t.text.font,
    textSize: t.text.sizeMm,
    marginV: t.text.marginVMm,
  };
}
