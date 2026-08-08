# 실시간 하천 수위 현황
# https://riverlevel-info.kr

## 1. 프로젝트 소개

### 1) 프로젝트 동기

대학 시절 2019년부터 구상해 온 서비스였는데, 개발 능력의 한계로 구상 단계에서 중단했었습니다.
<br>졸업하고 회사를 다니고 있는 도중, AI의 발달을 목도하고 퇴사 후에 드디어 개발을 해보게 되었습니다.

Claude와 함께 한 1인 개발입니다.

실시간 수위 정보는 이미 [한강홍수통제소](https://www.hrfco.go.kr/main.do#none)에서 제공되고 있습니다.

<img width="750" alt="image" src="https://github.com/niceotter/riverlevel_practice1/blob/main/public/readme/HRFCO%20main.png">

하지만 직관성과 가독성이 떨어집니다.

<img width="600" alt="image" src="https://github.com/niceotter/riverlevel_practice1/blob/main/public/readme/HRFCO%20RAW%20data.png">

한강홍수통제소 중랑교의 수위 자료를 예시로 보겠습니다.
<br>이 자료에는 2가지 그래프가 같이 표시되어 있습니다.

1. 먼저 하천의 단면도입니다.
<img width="600" alt="image" src="https://github.com/niceotter/riverlevel_practice1/blob/main/public/readme/HRFCO%20data%20-%20section%20view.png">

윗 눈금에 하천의 너비가 표시되어 있습니다.
<br>그리고 오른쪽 눈금에는 해발수위, 왼쪽 눈금에는 수위가 표시되어 있습니다.
<br>(수평·수직 축적은 상이하니 유의)
<br>해발수위의 영점은 인천 앞바다의 평균 해수면, 수위의 영점은 하천 바닥이라고 생각하시면 됩니다.
<br>이때 하천 바닥의 해발수위를 영점표고라고 하며, 중랑교의 경우 9.165EL.m입니다.
<br>그래서 해발수위의 각 눈금은 수위의 각 눈금에 9.165를 더한 값과 같습니다.

2. 수위의 시계열 그래프입니다.
<img width="600" alt="image" src="https://github.com/niceotter/riverlevel_practice1/blob/main/public/readme/HRFCO%20data%20-%20level.png">

아래 눈금에 시간 정보가 표시되어 있고, 맨 오른쪽 데이터가 가장 최신입니다.
<br>수위가 상승하면 관심단계 수위보다 높아질 수 있습니다.

이렇게 보면 그래프의 정보가 보이지만, 모르고 보면 '그래서 현재 수위가 얼마인데? 위험한거야?' 하게 됩니다.
<br>(알고 봐도 솔직히 하천 단면이나 해발수위 알게 뭐임.. 지금 출입 통제될지만 보면 되는데)

또한, 지자체에서 관리하기 때문에 한강홍수통제소에서 서비스 되지 않는 수위계도 있습니다.

그래서 직관적으로 알 수 있도록, 또한 데이터 통합을 위해 사이트를 개발하게 되었습니다.

### 2) 프로젝트 설명

<img width="800" alt="image" src="https://github.com/niceotter/riverlevel_practice1/blob/main/public/readme/main.png">

메인 사이트로 들어가면, 바로 보이는 지도에 핀을 꽂아 수위계 위치를 나타내었습니다.
<br>핀을 클릭하면 무슨 하천의 수위계인지 나옵니다.

<img width="800" alt="image" src="https://github.com/niceotter/riverlevel_practice1/blob/main/public/readme/main_close%20up%20map.png">

현재 수위 보기를 클릭하면 무슨 하천의 수위계인지, 언제 측정된 데이터인지, 영점표고와 현재 수위, 주의 수의 정보가 표출됩니다.

<img width="800" alt="image" src="https://github.com/niceotter/riverlevel_practice1/blob/main/public/readme/sub%20directory.png">


수위계의 사진도 볼수 있는데, 현재는 불광천 증산교의 사진만 제공되고 있습니다.

<img width="800" alt="image" src="https://github.com/niceotter/riverlevel_practice1/blob/main/public/readme/sub%20directory_pop%20up.png">

또한, 한강홍수통제소처럼 과거자료도 확인할 수 있습니다.

<img width="800" alt="image" src="https://github.com/niceotter/riverlevel_practice1/blob/main/public/readme/history%20page.png">

그 외에도 왼쪽 메뉴에서 현재 비구름의 위치나 기상정보 등을 확인할 수 있도록 외부 링크를 걸어두었습니다.


### 3) 프로젝트 Diagram

<img width="800" alt="image" src="https://github.com/niceotter/riverlevel_practice1/blob/main/public/readme/project%20diagram.png">



----------------------



This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
