$(document).ready(function () {
  //Load
  let outerHtml = todoItems
    .map(function (item) {
      return itemTemplate(item);
    })
    .reverse();
  $("#item-list").prepend(outerHtml);

  //Create
  $("#create-form").on("submit", function (e) {
    let input = DOMPurify.sanitize($("#create-field").val(), {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
    });
    console.log(input);
    if (!input) return;

    axios.post("/create-item", { text: input }).then(function (response) {
      let item = itemTemplate({ text: input, _id: response.data });
      $("#item-list").prepend(item);
    });

    $("#create-field").val("");
    $("#create-field").focus();

    e.preventDefault();
  });

  function itemTemplate(item) {
    return $(`
      <li class="list-group-item list-group-item-action d-flex align-items-center justify-content-between">
        <span class="item-text">${item.text}</span>
        <div>
          <button class="edit-me btn btn-secondary btn-sm mr-1" data-id="${item._id}">Edit</button>
          <button class="delete-me btn btn-danger btn-sm" data-id="${item._id}">Delete</button>
        </div>
      </li>`);
  }

  //Edit
  $("ul").on("click", ".edit-me", function () {
    let self = $(this);
    let input = prompt("Edit todo", self.parent().siblings("span").text());
    input = DOMPurify.sanitize(input, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
    });
    if (input) {
      axios
        .post("/update-item", { text: input, id: self.data("id") })
        .then(function () {
          self.parent().siblings("span").text(input);
        });
    }
  });

  //Delete
  $("ul").on("click", ".delete-me", function () {
    if (confirm("delete?")) {
      let self = $(this);

      axios.post("/delete-item", { id: self.data("id") }).then(function () {
        self.parent().parent().remove();
      });
    }
  });
});
