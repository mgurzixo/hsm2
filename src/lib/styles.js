"use strict";

import * as U from "src/lib/utils";
import { hsm } from "src/classes/Chsm";
import Color from "colorjs.io";

export function stateStyles(baseColor, id) {
  // Background
  let bg = new Color(baseColor);
  const s = hsm.settings.styles.state;
  const x = hsm.settings.styles.text;

  bg.lch.c = s.bg.chroma;
  bg.lch.l = s.bg.light;
  // Title backgrounds
  const titleBgs = [new Color(baseColor), new Color(baseColor)];
  [titleBgs[0].lch.l, titleBgs[1].lch.l] = [s.titleBg.lights[0], s.titleBg.lights[1]];
  [titleBgs[0].lch.c, titleBgs[1].lch.c] = [s.titleBg.chroma, s.titleBg.chroma];
  // Border
  const border = new Color(baseColor);
  border.lch.c = s.border.chroma;
  border.lch.l = s.border.light;
  // Title text
  let titleText = new Color(baseColor);
  titleText.lch.c = s.titleText.chroma;
  titleText.lch.l = s.titleText.light;
  // TitleLine
  const titleLine = new Color(baseColor);
  titleLine.lch.c = s.titleLine.chroma;
  titleLine.lch.l = s.titleLine.light;

  const t = hsm.settings.styles.tr;
  // Line
  const trLine = new Color(baseColor);
  trLine.lch.c = t.line.chroma;
  trLine.lch.l = t.line.light;
  const colLine = trLine.to("srgb") + "";

  const tagLine = new Color(baseColor);
  tagLine.lch.c = x.textChroma;
  tagLine.lch.l = x.textLight;
  const tagColor = tagLine.to("srgb") + "";
  tagLine.lch.c = x.borderChroma;
  tagLine.lch.l = x.borderLight;
  const tagBorderColor = tagLine.to("srgb") + "";
  tagLine.lch.c = x.borderSelectedChroma;
  tagLine.lch.l = x.borderSelectedLight;
  const borderSelected = tagLine.to("srgb") + "";


  return {
    bg: bg + "",
    border: border.to("srgb") + "",
    borderWidth: s.border.lineWidth,
    borderSelectedWidth: s.borderSelected.lineWidth,
    borderError: s.borderError.color,
    borderErrorWidth: s.borderError.lineWidth,
    titleLine: titleLine.to("srgb") + "",
    titleLineWidth: s.titleLine.lineWidth,
    titleBgs: [titleBgs[0].to("srgb") + "", titleBgs[1].to("srgb") + ""],
    titleText: titleText.to("srgb") + "",
    titleTextFont: s.titleText.font,
    titleTextSizePc: s.titleText.sizePc,

    trLine: colLine,
    trLineWidth: t.line.lineWidth,
    trLineSelectedWidth: t.lineSelected.lineWidth,
    trLineError: t.lineError.color,
    trLineErrorWidth: t.lineError.lineWidth,

    tagBg: bg + "",
    tagBorderColor: tagBorderColor || "black",
    tagBorderWidth: x.borderWidth,
    tagBorderSelectedColor: borderSelected || "red",
    tagBorderSelectedWidth: x.borderSelectedWidth,
    tagBorderPrintingColor: tagBorderColor,
    tagTextColor: tagColor || "green",
    tagTextSelectedColor: x.textColor,
    tagTextFont: x.textFont,
    tagTextSize: x.sizeMm,
    tagCornerP: x.tagCornerP,

    id: id,
  };
}

export function textStyles(baseColor) {
  const x = hsm.settings.styles.text;
  const trLine = new Color(baseColor);
  trLine.lch.c = x.textChroma;
  trLine.lch.l = x.textLight;
  const tagColor = trLine.to("srgb") + "";
  trLine.lch.c = x.borderChroma;
  trLine.lch.l = x.borderLight;
  const tagBorderColor = trLine.to("srgb") + "";
  trLine.lch.c = x.borderSelectedChroma;
  trLine.lch.l = x.borderSelectedLight;
  const borderSelected = trLine.to("srgb") + "";

  return {
    tagBg: "transparent",
    tagBorderColor: tagBorderColor,
    tagBorderWidth: x.borderWidth,
    tagBorderSelectedColor: borderSelected,
    tagBorderSelectedWidth: x.borderSelectedWidth,
    tagTextColor: tagColor,
    tagTextSelectedColor: x.textColor,
    tagTextFont: x.textFfont,
    tagCornerP: x.tagCornerP,
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
    textSelectedColor: t.text.color,
    textFont: t.text.font,
    cornerP: hsm.settings.noteCornerP
  };
}

// export function textStyles(baseColor) {
//   const t = hsm.settings.styles.text;
//   return {
//     bg: t.bg.color,
//     borderColor: t.border.color,
//     borderWidth: t.border.lineWidth,
//     borderSelectedColor: t.borderSelected.color,
//     borderSelectedWidth: t.borderSelected.lineWidth,
//     textColor: t.text.color,
//     textFont: t.text.font,
//     textSize: t.text.sizeMm,
//     marginV: t.text.marginVMm,
//   };
// }
