import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Image from "next/image";

export const metadata = {
  title: "Sportsbooks | Pro Football Report",
  description:
    "NFL betting odds, sportsbook reviews, betting guides, and more.",
};

export default function SportsbookPage() {
  const sportsbooks = [
    { src: "/images/Fanatics.svg", alt: "BetFanatics Logo", href: "https://betfanatics.com/?pid=inteliticstech_int&af_siteid=Leadstar&c=Sportsbooksonline-Sports-Tier1-PromoSBOVIP&af_click_lookback=7d&deep_link_value=%2Facquisition%2FSBOVIP&clickid=87d5188c-73cc-4d65-bbae-6525582633e2/", name: "BetFanatics" },
    { src: "/images/fanduel.svg", alt: "Fanduel Logo", href: "https://www.fanduel.com/sportsbook-affiliate-nba-playoffs?btag=a_24022b_16c_&siteid=24022", name: "FanDuel" },
    { src: "/images/bet365.svg", alt: "Bet365 Logo", href: "https://www.on.bet365.ca/?#/HO/", name: "Bet365 " },
    { src: "/images/Caesars.svg", alt: "Caesars Logo", href: "https://caesars.com/sportsbook-and-casino/welcome/?AR=a-16027b-2486&bc=SBODYW&utm_offer=SBODYW&siteid=16027&af_c_id=SBODYW", name: "Caesars" },
    { src: "/images/Draftkings.svg", alt: "Draftkings Logo", href: "https://sportsbook.draftkings.com/acq-bet-and-get?referrer=singular_click_id%3d62b0cdaf-52cf-4853-971c-b7de4e6b913e&wpcid=270755&wpcn=Gen&wpcrid=xx&wpcrn=Sportsbooksonline&wpscid=xx&wpscn=Bet5Get200&wpsrc=2608", name: "DraftKings" },
    { src: "/images/BetMGM.svg", alt: "BetMGM Logo", href: "https://promo.on.betmgm.ca/en/promo/sports/first-bet-offer?wm=7081910", name: " BetMGM " },
    { src: "/images/Betrivers.svg", alt: "Betrivers Logo", href: "https://ny.betrivers.com/?page=landing&btag=a_11777b_3583c_&siteid=11777", name: "BetRivers" },
    { src: "/images/sporttrade.svg", alt: "Sporttrade Logo", href: "https://getsporttrade.com/sportsbooksonline/", name: "Sporttrade " },
    { src: "/images/HardRock.svg", alt: "Hard Rock Logo", href: "https://www.hardrock.bet/sportsbook/virginia/?btag=a_691b_140c_&af_channel=[site_id]&c=140&af_ad=&af_siteid=691&af_sub1=a_691b_140c_&pid=incomeaccess_int&af_ad_type=affiliate&siteid=691", name: "Hard Rock " },
    { src: "/images/Desert Diamond.svg", alt: "Desert Diamond Logo", href: "https://www.playdesertdiamond.com/en/sports/sports-hub/american_football/nfl?btag=a_10b_49c_&pid=incomeaccess_int&af_sub1=a_10b_49c_&af_siteid=5032-2-10-10", name: "Desert Diamond " },
    { src: "/images/Underdog.svg", alt: "Underdog Logo", href: "https://www.underdogsportsbook.com/", name: "Underdog " },
    { src: "/images/888Sport.svg", alt: "888Sport Logo", href: "https://www.888sport.ca/?utm_campaign=100082733_2015718_nodescription&utm_content=100082733&utm_medium=casap&utm_source=aff", name: "888Sport" },
    { src: "/images/Leovegas.svg", alt: "Leovegas Logo", href: "https://promo.leovegas.com/ca-on/ppcbrandnlp?btag=100662797_d19fd58ea73a48009708e1d53d67dc88&utm_source=google&utm_medium=cpc&utm_campaign=PPC-CAON-LV-CNVR-TextAd-Combined-ALL-GOO-P2P-BRA&utm_term=%7Bkeyword%7D&pid=3730498&bid=20392&gad_source=1&gad_campaignid=15976785250&gbraid=0AAAAAoZWGgwkQorUxj9rLMrwqqQgofAvi&gclid=CjwKCAjw87XBBhBIEiwAxP3_A0TDEKq9kYunw4KcrZudAS8lXq7YnwCVeKtX0Q0mRp8pMs8-GeTs3xoCIQUQAvD_BwE", name: "LeoVegas" },
    { src: "/images/powerplay.svg", alt: "Powerplay Logo", href: "https://on.powerplay.com/registration/?https://on.powerplay.com/registration/?btag=a_43120b_27c_ONTBrand_KW_-_powerplay%20bet_gclid_-_CjwKCAjw87XBBhBIEiwAxP3_A5gd0u_EA7O8GhffMJWESJtkd_I2lk0NNK9VSDSVzgh8lq5n8_wPiRoCB-EQAvD_BwE&keyword=powerplay%20bet&siteid=43120&s1=lowPerformKWs&gad_source=1&gad_campaignid=22559361095&gbraid=0AAAAApF__-q8DL_ZwvGQ_S9A2C7UimATu&gclid=CjwKCAjw87XBBhBIEiwAxP3_A5gd0u_EA7O8GhffMJWESJtkd_I2lk0NNK9VSDSVzgh8lq5n8_wPiRoCB-EQAvD_BwE", name: "PowerPlay" },
    { src: "/images/OLG Proline.svg", alt: "OLG Proline Logo", href: "https://www.olg.ca/en/account/registration.html?campaigncode=sportsplayoffsb10g50&utm_source=googleads&utm_campaign=search_olg_proline+launch_olgproalwaysonfy25_brand&gad_source=1&gad_campaignid=14429909235&gbraid=0AAAAABeXjSn10FTHoYqRNNxpFPrNDrJhE&gclid=CjwKCAjw87XBBhBIEiwAxP3_Az3yfz1910b8-eY_X7dF4hT5DI50GPbGldONWNyR--UW8aajfFd3rhoCzdEQAvD_BwE&gclsrc=aw.ds#/pre-registration", name: "OLG PROLINE+" },
  ];

  return (
    <div className="bg-[#ECCE8B] min-h-screen">
      <Nav />
      <div className="max-w-7xl mx-auto px-4 py-10">

        {/* Disclaimer Banner */}
        <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-8">
          <p className="text-yellow-700">
            <span className="font-bold">DISCLAIMER:</span> This content is for
            informational and entertainment purposes only. No betting odds or
            information on this page constitutes a solicitation to place a bet
            or to use any sports betting services.
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          {/* Card View for All Screen Sizes */}
          <div className="space-y-4">
            {sportsbooks.map(({ src, alt, href, name }, index) => (
              <div key={index} className="border rounded-lg p-4 flex items-center space-x-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center flex-shrink-0">
                  <Image
                    src={src}
                    alt={alt}
                    width={80}
                    height={80}
                    className="object-contain w-full h-full"
                  />
                </div>
                <div className="flex-1 text-center">
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-lg md:text-xl font-semibold block"
                  >
                    {name}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}