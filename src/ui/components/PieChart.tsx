"use client";
/*
 * Documentation:
 * Pie Chart — https://app.subframe.com/library?component=Pie+Chart_0654ccc7-054c-4f3a-8e9a-b7c81dd3963c
 */

import React from "react";
import * as SubframeUtils from "../utils";
import * as SubframeCore from "@subframe/core";

interface PieChartRootProps
  extends React.ComponentProps<typeof SubframeCore.PieChart> {
  className?: string;
}

const PieChartRoot = React.forwardRef<HTMLElement, PieChartRootProps>(
  function PieChartRoot({ className, ...otherProps }: PieChartRootProps, ref) {
    return (
      <SubframeCore.PieChart
        className={SubframeUtils.twClassNames("h-52 w-52", className)}
        ref={ref as any}
        colors={[
          "#00647d",
          "#073844",
          "#05a2c2",
          "#064150",
          "#00b1cc",
          "#045063",
        ]}
        dark={true}
        {...otherProps}
      />
    );
  }
);

export const PieChart = PieChartRoot;
