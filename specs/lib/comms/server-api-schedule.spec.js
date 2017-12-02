var URL = 'http://localhost:3000/'
var sandbox;

function requestPoolDataWithURL(endpoint) {
    //console.log('pending - request sent for ' + endpoint)
    return getAllPoolData(endpoint).then(
        function(response) {
            //  console.log('success - received data for %s request: %s', endpoint, JSON.stringify(response.body));
            return response.body;
        }
    );
};

function getAllPoolData(endpoint) {
    var options = {
        method: 'GET',
        uri: URL + endpoint,
        resolveWithFullResponse: true,
        json: true
    };
    return rp(options);
};


describe('server', function() {
    describe('#schedule api calls', function() {

        context('with a URL', function() {

            before(function() {
                bottle.container.server.init()
                bottle.container.schedule.init()

                bottle.container.logger.transports.console.level = 'silly';
            })

            beforeEach(function() {
                sandbox = sinon.sandbox.create()
                clock = sandbox.useFakeTimers()
                sandbox.stub(bottle.container.intellitouch, 'getPreambleByte').returns(33)
                loggerInfoStub = sandbox.stub(bottle.container.logger, 'info')
                loggerWarnStub = sandbox.stub(bottle.container.logger, 'warn')
                loggerVerboseStub = sandbox.stub(bottle.container.logger, 'verbose')
                loggerDebugStub = sandbox.stub(bottle.container.logger, 'debug')
                loggerSillyStub = sandbox.stub(bottle.container.logger, 'silly')
                writeSPPacketStub = sandbox.stub(bottle.container.sp, 'writeSP').callsFake(function(){bottle.container.writePacket.postWritePacketHelper()})
                writeNETPacketStub = sandbox.stub(bottle.container.sp, 'writeNET').callsFake(function(){bottle.container.writePacket.postWritePacketHelper()})
                checkIfNeedControllerConfigurationStub = sandbox.stub(bottle.container.intellitouch, 'checkIfNeedControllerConfiguration')
                global.schedules_chk.forEach(function(el){
                    bottle.container.packetBuffer.push(Buffer.from(el))
                })
            })

            afterEach(function() {
                bottle.container.writePacket.init()
                bottle.container.queuePacket.init()
                sandbox.restore()
            })

            after(function() {
                bottle.container.schedule.init()
                bottle.container.server.close()
                bottle.container.logger.transports.console.level = 'info'
            })



            it('send a packet to toggle schedule 1 day Sunday', function(done) {
                requestPoolDataWithURL('schedule/toggle/id/1/day/1').then(function(obj) {
                    writeSPPacketStub.args[0][0].should.deep.equal([ 255, 0, 255, 165, 33, 16, 33, 145, 7, 1, 6, 9, 20, 15, 59, 254, 2, 251 ])
                }).then(done,done)
            });


            it('send a packet to delete schedule 1', function(done) {
                requestPoolDataWithURL('schedule/delete/id/1').then(function(obj) {
                    writeSPPacketStub.args[0][0].should.deep.equal([ 255, 0, 255, 165, 33, 16, 33, 145, 7, 1, 0, 0, 0, 0, 0, 0, 1, 144])
                }).then(done,done);
            });

            it('send a packet to start schedule 1 at 11:11am', function(done) {
                requestPoolDataWithURL('schedule/set/id/1/startOrEnd/start/hour/11/min/11').then(function(obj) {
                    writeSPPacketStub.args[0][0].should.deep.equal([ 255, 0, 255, 165, 33, 16, 33, 145, 7, 1, 6, 11, 11, 15, 59, 255, 2, 245 ])
                }).then(done,done)
            });

            it('send a packet to end schedule 1 at 12:12am', function(done) {
                requestPoolDataWithURL('schedule/set/id/1/startOrEnd/end/hour/12/min/12').then(function(obj) {
                    writeSPPacketStub.args[0][0].should.deep.equal([ 255, 0, 255, 165, 33, 16, 33, 145, 7, 1, 6, 9, 20, 12, 12, 255, 2, 202 ])
                }).then(done,done)
            });

            it('send a packet to set schedule 1 to circuit 15', function(done) {
                requestPoolDataWithURL('schedule/set/id/1/circuit/15').then(function(obj) {
                    writeSPPacketStub.args[0][0].should.deep.equal([ 255, 0, 255, 165, 33, 16, 33, 145, 7, 1, 15, 9, 20, 15, 59, 255, 3, 5 ])
                }).then(done,done)
            });

            it('send a packet to set schedule 1 to circuit 15, 1:23 to 3:45 on Sunday (old method)', function(done) {
                requestPoolDataWithURL('setSchedule/1/15/1/23/3/45/1').then(function(obj) {
                    writeSPPacketStub.args[0][0].should.deep.equal([ 255, 0, 255, 165, 33, 16, 33, 145, 7, 1, 15, 1, 23, 3, 45, 1, 1, 232 ])
                }).then(done,done)
            });


            it('send a packet to set egg timer 9 to circuit 10, 3 hr 45 min', function(done) {
                requestPoolDataWithURL('eggtimer/set/id/9/circuit/10/hour/3/min/45').then(function(obj) {
                    writeSPPacketStub.args[0][0].should.deep.equal([ 255, 0, 255, 165, 33, 16, 33, 145, 7, 9, 10, 25, 0, 3, 45, 0, 1, 235 ])
                }).then(done,done)
            });

        });

    });
});