const request = require('request');
const cheerio = require('cheerio');
const fs = require('fs');
// console.log(`fjsdkl${'a'}`);

const Areas = ['Kingston',
'Richmond',
'Wimbledon',
'Wandsworth',
'Hammersmith',
'Westminster',
'Kensington+%26+Chelsea',
'Sutton',
'Luton',
];

const schoolResult = [];
let schoolCount = 0;

const json2csv = require('json2csv');
const fields = ['area', 'name', 'link', 'schoolWebsite', 'population', 'ageRange', 'gender', 'schoolType', 'address', 'distanceToCity', 'specialist', 'destination (16 to 18)'];

const schoolDataKeys = {
  'Address': 'address',
  // 'Local authority': '',
  // 'Headteacher/Principal': '',
  'Age range': 'ageRange',
  'Phase of education': 'phaseOfEducation',
  'School type': 'schoolType',
  // 'Academy sponsor': '',
  'Gender of entry': 'gender',
  'Denomination': 'denomination',
  'Admissions policy': 'admissionsPolicy',
  // 'Unique reference': '',
  // 'Ofsted rating': '',
  // 'Useful links': '',
  // 'Download data': '',
};

const dumpResult = () => {
  if (schoolResult.length == schoolCount) {
    // console.log('hello');
    // console.log(schoolCount);
    schoolResult.sort((a, b) => {return Areas.indexOf(a.area) - Areas.indexOf(b.area)});
    const result = json2csv({ data: schoolResult, fields: fields, hasCSVColumnTitle: true });
    // console.log(result);
    fs.writeFile('file.csv', result, function(err) {
      if (err) throw err;
      console.log('file saved');
    });
  }
}

const populateTabData = ($, schoolLink, schoolData) => {
  request(`${schoolLink}?tab=absence-and-pupil-population`, (error, response, html) => {
    const $ = cheerio.load(html);
    const population = $('#content > div.grid-row.tabs > div.column-full.absence-and-pupil-population.active > div:nth-child(9) > div > table > tbody > tr:nth-child(1) > td:nth-child(2)').text().trim();
    schoolData['population'] = population;

    // console.log(schoolData);
    schoolResult.push(schoolData);
    dumpResult();
  });
}

const populateSchoolInfo = (area, schoolLink) => {
  request(schoolLink, (error, response, html) => {
    if (!error && response.statusCode == 200) {
      const $ = cheerio.load(html);

      const schoolData = {
        area: area,
        name: $('#content > header > h1').text(),
        link: schoolLink,
      }

      $('#content > div.grid-row.mbl > div:nth-child(1) > dl > dt').text().split(':').forEach((key, i) => {
        if(key in schoolDataKeys) {
          schoolData[schoolDataKeys[key]] = $(`#content > div.grid-row.mbl > div:nth-child(1) > dl > dd:nth-child(${(i+1)*2})`).text()
        }
      })

      populateTabData($, schoolLink, schoolData);
    }
  });
}

const findSchools = (area) => {
  request(`https://www.compare-school-performance.service.gov.uk/find-a-school-in-england?radius=1&ofstedrating=1&searchtype=search-by-location&keywords=${area}`, (error, response, html) => {
    if (!error && response.statusCode == 200) {
      const $ = cheerio.load(html);
      const schoolLinks = $('#js-results > div > div.list > ul > li > div > h3 > a');
      schoolCount += schoolLinks.length;
      schoolLinks.each(function(i, element){
        const a = $(this);
        const schoolName = a.text();
        const schoolLink = `https://www.compare-school-performance.service.gov.uk${a.attr('href')}`;
        populateSchoolInfo(area, schoolLink);
      });

      // console.log(schoolResult);
      // try {
      //   const result = json2csv({ data: schoolResult, fields: fields, hasCSVColumnTitle: false });
      //   console.log(result);
      // } catch (err) {
      //   // Errors are thrown for bad options, or if the data is empty and no fields are provided.
      //   // Be sure to provide fields if it is possible that your data array will be empty.
      //   console.error(err);
      // }
    }
  });
}

Areas.forEach((area) => {
  findSchools(area);
})

// findSchools('Kingston')
