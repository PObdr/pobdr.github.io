export function northUpSelection(selection, trueBearing) {
  if (!Number.isFinite(trueBearing)) {
    throw new Error('Neplatný směr zeměpisného severu');
  }
  const { origin, axisX, axisY, width, height } = selection;
  const gridAngle = Math.atan2(axisX[1], -axisY[1]);
  const angle = gridAngle + trueBearing * Math.PI / 180;
  const vertical = Math.cos(angle);
  const horizontal = Math.sin(angle);
  const epsilon = 1e-12;
  const flip = vertical < -epsilon ||
    (Math.abs(vertical) <= epsilon && horizontal < 0);
  if (!flip) return selection;

  // Move to the opposite corner and reverse both axes: a rotation, not a mirror.
  return {
    ...selection,
    origin: [
      origin[0] + width * axisX[0] + height * axisY[0],
      origin[1] + width * axisX[1] + height * axisY[1]
    ],
    axisX: axisX.map((value) => -value || 0),
    axisY: axisY.map((value) => -value || 0)
  };
}
