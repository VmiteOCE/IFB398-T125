import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer} from "recharts";
import { Row, Col } from "react-bootstrap";
export default function ZoneTimeGraphs({getZoneTime,intervals,zones,awayName,formatTime}) 
{
  // Turn zone time into data for Recharts
  const makeGraphData = (teamId) => {
    return intervals.map((interval) => {
      const row = {
        interval: interval.label
      };

      zones.forEach((zone) => {
        row[zone] =
          getZoneTime(
            teamId,
            zone,
            interval.start,
            interval.end,
            interval.half
          ) / 60;
      });

      return row;
    });
  };

  const redsData = makeGraphData(1); // reds graph data
  const awayData = makeGraphData(2); // away team graph data


  // Find the largest total interval for x axis
  const getLargestInterval = () => {
    const allData = [...redsData, ...awayData];

    const largest = Math.max(
      ...allData.map((interval) =>
        zones.reduce((total, zone) => total + interval[zone],0)
      )
    );
    return Math.max(1, Math.ceil(largest));
  };

  const MaxX = getLargestInterval();

  // Same zone colours as the Excel graph - changed M becasue was hard to see
  const zoneColours = {
    D: "#2c7bb6",
    C: "#abd9e9",
    M: "#0ef805ff",
    B: "#fdae61",
    A: "#d7191c"
  };

  const renderGraph = (teamName, graphData) => {
    return (
        <div className="analysis-graph">
        <h4 className="analysis-graph-title">
          {teamName}
        </h4>

        <div
          style={{width: "100%", border: "1px solid", padding: "5px"}}
        >
          <ResponsiveContainer width="100%" aspect={1}>
            <BarChart
              data={graphData}
              layout="vertical"
              margin={{top: 0,right: 20,left: 5,bottom: 10}}
              barCategoryGap="35%"
            >
              <CartesianGrid
                vertical={true}
                horizontal={false}
                stroke="#ffffffff"
              />
              
              <XAxis
                type="number"
                domain={[0, MaxX]}
                allowDecimals={false}
                tickCount={MaxX + 1}
                label ={{value: "Minutes in Zone", position: "insideBottom", offset: -10}}
              />

              <YAxis
                type="category"
                dataKey="interval"
                width={70}
                interval={0}
                axisLine={false}
                tickLine={false}
                label ={{value: "Time Interval", angle:-90, position: "insideLeft"}}
              />
              <Tooltip
                formatter={(value, name) => [
                  formatTime(value*60),
                  `Zone ${name}`
                ]}
              />
              {zones.map((zone) => (
                <Bar
                  key={zone}
                  dataKey={zone}
                  stackId="zoneTime"
                  fill={zoneColours[zone]}
                  isAnimationActive={false}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };


  return (
    <div
      style={{backgroundColor: "white",color: "black",padding: "20px",borderRadius: "8px",marginTop: "20px"}}
    >

      <h5
        style={{textAlign: "center",marginBottom: "20px"}}
      >
        Minutes per zone
      </h5>

      <Row className="g-4 align-items-center">

        {/* Reds graph */}
          <Col xs={12} lg={5}>
          {renderGraph("Reds", redsData)}
          </Col>

        {/* Legend */}
        <Col xs={12} lg={2}>
        <div className="d-flex flex-row flex-lg-column flex-wrap justify-content-center gap-2">
          {zones.map((zone) => (
            <div
              key={zone}
              style={{display: "flex",alignItems: "center"}}
              >
              <div
                style={{width: "50px",height: "30px",backgroundColor: zoneColours[zone]}}
              />
              <span
                style={{marginLeft: "10px",fontSize: "15px"}}
              >
                {zone}
              </span>
            </div>
          ))}
        </div>
        </Col>

        {/* Away graph */}
          <Col xs={12} lg={5}>
          {renderGraph(awayName, awayData)}
          </Col>
        </Row>
      </div>
  );
}

