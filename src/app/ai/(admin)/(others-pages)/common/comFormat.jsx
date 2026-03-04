export default function comFormat({ type, input, mode, startDate, endDate }) {
  let res = "";
  const formatDateTh = (string, code) => {
    if (string != null) {
      const date = new Date(string); // Parse the date string
      let month_th = "มกราคม";
      // Extract year, month, and day in the desired format
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minute = String(date.getMinutes()).padStart(2, "0");
      let year_th = year + 543;

      switch (month) {
        case "01":
          month_th = "มกราคม";
          break;
        case "02":
          month_th = "กุมภาพันธ์";
          break;
        case "03":
          month_th = "มีนาคม";
          break;
        case "04":
          month_th = "เมษายน";
          break;
        case "05":
          month_th = "พฤษภาคม";
          break;
        case "06":
          month_th = "มิถุนายน";
          break;
        case "07":
          month_th = "กรกฎาคม";
          break;
        case "08":
          month_th = "สิงหาคม";
          break;
        case "09":
          month_th = "กันยายน";
          break;
        case "10":
          month_th = "ตุลาคม";
          break;
        case "11":
          month_th = "พฤศจิกายน";
          break;
        case "12":
          month_th = "ธันวาคม";
          break;
        default:
          month_th = "";
          break;
      }

      switch (code) {
        case "F1":
          return `${day}/${month_th}/${year_th}`;
          break;
        case "F2":
          return `${day}/${month_th}/${year_th} ${hours}:${minute}`;
          break;
        case "D":
          return `${day}`;
          break;
        case "M":
          return `${month_th}`;
          break;
        case "Y":
          return `${year_th}`;
          break;
        default:
          return ``;
          break;
      }
    } else {
      return string; // Return as is if null or undefined
    }
  };

  const compareDates = (start, end, code) => {
    const firstDate = new Date(start);
    const secondDate = new Date(end);

    const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
    const diffDays = Math.round(Math.abs((firstDate - secondDate) / oneDay));
    const diffMonths = parseInt(diffDays / 30);
    const diffYears = parseInt(diffDays / 365);

    switch (code) {
      case "D":
        return diffDays;
        break;
      case "M":
        return diffMonths;
        break;
      case "Y":
        return diffYears;
        break;
      default:
        return "";
        break;
    }
  };

  const formatDate = (string, code) => {
    if (string != null) {
      const date = new Date(string); // Parse the date string

      // Extract year, month, and day in the desired format
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minute = String(date.getMinutes()).padStart(2, "0");
      switch (code) {
        case "F1":
          // Combine into the desired format: dd/MM/yyyy
          return `${day}/${month}/${year}`;
          break;
        case "F2":
          // Combine into the desired format: dd/MM/yyyy HH:mm
          return `${day}/${month}/${year} ${hours}:${minute}`;
          break;

        default:
          return ``;
          break;
      }
    } else {
      return string; // Return as is if null or undefined
    }
  };

  const numToStringDigit = (input, digit) => {
    let numStr = "";
    switch (input) {
      case "0":
        numStr = "ศูนย์";
        break;
      case "1":
        if (digit == 1 || digit == 2) numStr = "";
        else numStr = "หนึ่ง";
        break;
      case "2":
        if (digit == "2") numStr = "ยี่";
        else numStr = "สอง";
        break;
      case "3":
        numStr = "สาม";
        break;
      case "4":
        numStr = "สี่";
        break;
      case "5":
        numStr = "ห้า";
        break;
      case "6":
        numStr = "หก";
        break;
      case "7":
        numStr = "เจ็ด";
        break;
      case "8":
        numStr = "แปด";
        break;
      case "9":
        numStr = "เก้า";
        break;
      default:
        numStr = "";
        break;
    }
    return numStr;
  };

  const numDigitName = (input, digit) => {
    let numStr = "";
    if (digit != "0") {
      switch (input) {
        case 1:
          if (digit == "1") numStr = "เอ็ด";
          else numStr = "";
          break;
        case 2:
          numStr = "สิบ";
          break;
        case 3:
          numStr = "ร้อย";
          break;
        case 4:
          numStr = "พัน";
          break;
        case 5:
          numStr = "หมื่น";
          break;
        case 6:
          numStr = "แสน";
          break;
        case 7:
          numStr = "ล้าน";
          break;
        case 8:
          numStr = "สิบ";
          break;
        case 9:
          numStr = "ร้อย";
          break;
        case 10:
          numStr = "พัน";
          break;
        case 11:
          numStr = "หมื่น";
          break;
        case 12:
          numStr = "แสน";
          break;
        case 13:
          numStr = "ล้าน";
          break;
        default:
          numStr = "";
          break;
      }
    }
    return numStr;
  };

  const allEqual = (arr) => arr.every((val) => val === arr[0]);

  const numToTextTh = (input) => {
    let inputStr = input.toString();
    let res = "";
    let digitStr = "";
    let inputSplit = inputStr.split(".");

    inputSplit.forEach((e, index) => {
      if (index == 0) {
        let temp = e;
        let list = temp.split("");
        let tempText = "";
        list.forEach((el, i) => {
          tempText +=
            numToStringDigit(el, list.length - i) +
            numDigitName(list.length - i, el);
        });
        res = tempText.replaceAll("ศูนย์", "");
      }
      if (index == 1) {
        let temp = e;
        let list = temp.split("");
        if (list.length > 0) {
          let result = false;
          if (list[0] == "0") {
            result = allEqual(list);
          }
          if (!result) {
            list.forEach((el) => {
              digitStr += numToStringDigit(el);
            });
          }
        }
      }
    });
    if (digitStr != "") {
      res += "จุด" + digitStr;
    }
    return res + "บาทถ้วน";
  };

  const getAge = (dateString, code) => {
    var today = new Date();
    var birthDate = new Date(dateString);
    var age = today.getFullYear() - birthDate.getFullYear();
    var m = today.getMonth() - birthDate.getMonth();
    var d = today.getDay() - birthDate.getDay();
    if (d < 0) {
      d = 0;
    }
    if (d < 0 || (d === 0 && today.getDate() < birthDate.getDate())) {
      m--;
    }
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    if (age < 0) age = 0;
    if (m < 0) m = 0;
    if (d < 0) d = 0;
    switch (code) {
      case "F1":
        return `${age} ปี ${m} เดือน ${d} วัน`;
        break;
      case "F2":
        return `${age} ปี`;
        break;
      default:
        "";
        break;
    }
  };

  switch (type) {
    case "date":
      res = formatDate(input, mode);
      break;
    case "date_th":
      res = formatDateTh(input, mode);
      break;
    case "compareDates":
      res = compareDates(startDate, endDate, mode);
      break;
    case "age":
      res = getAge(input, mode);
      break;
    case "numToString-th":
      res = numToTextTh(input);
      break;

    default:
      res = "";
      break;
  }
  return res;
}
