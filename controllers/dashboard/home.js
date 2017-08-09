'use strict';
const Joi = require('joi');
const Duration = require('humanize-duration');


module.exports = {
  description: 'Dashboard',
  tags: ['web', 'metrics'],
  handler: async function (request, reply) {
    const params = Object.assign({}, request.query);
    const limit = params.limit || 25;
    params.offset = ((params.page || 1) - 1) * limit;

    const count = await this.db.rooms.count(params)
    const activeCount = await this.db.rooms.count_active();
    const userCount = await this.db.users.count_active();
    const roomDayCount = await this.db.rooms.count_period({
      ts: new Date(),
      interval: '1 day'
    });
    const roomMonthCount = await this.db.rooms.count_period({
      ts: new Date(),
      interval: '30 days'
    });

    request.totalCount = count.count;

    const rooms = await this.db.rooms.all(params);
    const pagesArr = new Array(Math.ceil(request.totalCount / limit)).fill(0);

    for (let room of rooms) {
      const end = (room.ended_at || new Date(Date.now())).getTime();
      const start = room.created_at.getTime();

      room.duration = Duration(end - start);
    }

    return reply.view('list_of_rooms', {
      pages: pagesArr,
      data: rooms,
      activeRoomCount: activeCount.count,
      activeUserCount: userCount.count,
      prevDayRoomCount: roomDayCount.count,
      prevMonthRoomCount: roomMonthCount.count
    });
  },
  validate: {
    query: {
      limit: Joi.number().default(25).min(1).max(100),
      page: Joi.number().positive()
    }
  }
};
