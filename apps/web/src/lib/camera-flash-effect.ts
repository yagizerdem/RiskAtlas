import $ from "jquery";
import { v4 as uuidv4 } from "uuid";

let ready: boolean = false;
$(document).ready(function () {
  ready = true;
});

interface FlashOptions {
  initialOpacity?: number;
  finalOpacity?: number;
  duration?: number;
}

export async function flash(options?: FlashOptions) {
  if (!ready) return;

  const flashId = uuidv4();

  const flashLayer = `
    <div class="flash" id="${flashId}">
    </div>
  `;

  $("body").append(flashLayer);
  $(`#${flashId}`).css({
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "white",
    zIndex: 9999,
  });

  $(`#${flashId}`)
    .show() //show the hidden div
    .animate(
      { opacity: options?.finalOpacity ?? 0.4 },
      options?.duration ?? 300,
      () => {
        $(`#${flashId}`).remove();
      },
    )
    .fadeOut(options?.duration ?? 300)
    .css({ opacity: options?.initialOpacity ?? 1 });
}
